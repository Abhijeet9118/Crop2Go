const express = require('express');
const router = express.Router();
const https = require('https');

// In-memory audio cache to provide instant (0ms) voice responses for repeated phrases
const audioCache = new Map();

/**
 * Fetch an MP3 audio chunk from Google TTS service
 */
function fetchTtsChunk(text, lang = 'hi') {
  return new Promise((resolve, reject) => {
    const cleanText = text.trim();
    if (!cleanText) return resolve(Buffer.alloc(0));

    // Map language code
    let tl = 'hi';
    if (lang.startsWith('mr')) tl = 'mr';
    else if (lang.startsWith('en')) tl = 'en';
    else if (lang.startsWith('bn')) tl = 'bn';
    else if (lang.startsWith('gu')) tl = 'gu';
    else if (lang.startsWith('ta')) tl = 'ta';
    else if (lang.startsWith('te')) tl = 'te';

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${tl}&client=tw-ob`;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      },
      timeout: 10000
    };

    const req = https.get(url, options, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`TTS service returned status code ${response.statusCode}`));
      }

      const chunks = [];
      response.on('data', (d) => chunks.push(d));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('TTS request timed out'));
    });
  });
}

/**
 * Split text into chunks <= 180 characters along sentence boundaries
 */
function splitTextIntoChunks(text, maxLength = 180) {
  if (text.length <= maxLength) return [text];

  const sentences = text.split(/(?<=[।!?.])\s+/);
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length <= maxLength) {
      current = (current + ' ' + sentence).trim();
    } else {
      if (current) chunks.push(current);
      if (sentence.length <= maxLength) {
        current = sentence;
      } else {
        // Split long sentence by commas or words
        const words = sentence.split(/\s+/);
        current = '';
        for (const word of words) {
          if ((current + ' ' + word).trim().length <= maxLength) {
            current = (current + ' ' + word).trim();
          } else {
            if (current) chunks.push(current);
            current = word;
          }
        }
      }
    }
  }

  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [text.slice(0, maxLength)];
}

/**
 * GET /api/tts?text=...&lang=hi
 * Streams high-definition, studio-quality MP3 speech
 */
router.get('/', async (req, res) => {
  const { text, lang = 'hi' } = req.query;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text query parameter is required' });
  }

  const cleanText = text.replace(/[*#`_~]/g, '').trim();
  const cacheKey = `${lang}:${cleanText}`;

  // Check cache first
  if (audioCache.has(cacheKey)) {
    const cachedBuffer = audioCache.get(cacheKey);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': cachedBuffer.length,
      'Cache-Control': 'public, max-age=86400',
      'Accept-Ranges': 'bytes'
    });
    return res.send(cachedBuffer);
  }

  try {
    const chunks = splitTextIntoChunks(cleanText);
    const audioBuffers = [];

    for (const chunk of chunks) {
      if (chunk.trim()) {
        const buf = await fetchTtsChunk(chunk, lang);
        audioBuffers.push(buf);
      }
    }

    const combinedBuffer = Buffer.concat(audioBuffers);

    // Save in cache (keep cache size capped to prevent memory buildup)
    if (audioCache.size > 500) {
      const firstKey = audioCache.keys().next().value;
      audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, combinedBuffer);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': combinedBuffer.length,
      'Cache-Control': 'public, max-age=86400',
      'Accept-Ranges': 'bytes'
    });

    return res.send(combinedBuffer);
  } catch (err) {
    console.error('TTS generation error:', err.message);
    return res.status(502).json({ error: 'Failed to generate speech audio', details: err.message });
  }
});

module.exports = router;

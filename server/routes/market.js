const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

router.get('/prices', (req, res) => {
  try {
    const db = getDb();
    let prices = [];
    try {
      prices = db.prepare(`SELECT * FROM mandi_prices ORDER BY crop, market`).all();
    } catch (e) {
      prices = [];
    }

    if (prices.length === 0) {
      prices = [
        { crop: 'Tomato', market: 'Azadpur (Delhi)', state: 'Delhi', min_price: 24, max_price: 36, modal_price: 30 },
        { crop: 'Tomato', market: 'Vashi APMC (Navi Mumbai)', state: 'Maharashtra', min_price: 26, max_price: 42, modal_price: 35 },
        { crop: 'Tomato', market: 'Kolar Mandi', state: 'Karnataka', min_price: 20, max_price: 32, modal_price: 28 },
        { crop: 'Tomato', market: 'Pimpalgaon Mandi', state: 'Maharashtra', min_price: 22, max_price: 34, modal_price: 29 },

        { crop: 'Onion', market: 'Lasalgaon Mandi', state: 'Maharashtra', min_price: 18, max_price: 26, modal_price: 22 },
        { crop: 'Onion', market: 'Azadpur (Delhi)', state: 'Delhi', min_price: 22, max_price: 30, modal_price: 26 },
        { crop: 'Onion', market: 'Yeshwanthpur APMC', state: 'Karnataka', min_price: 20, max_price: 28, modal_price: 24 },

        { crop: 'Potato', market: 'Agra Mandi', state: 'Uttar Pradesh', min_price: 12, max_price: 18, modal_price: 15 },
        { crop: 'Potato', market: 'Vashi APMC', state: 'Maharashtra', min_price: 16, max_price: 24, modal_price: 20 },
        { crop: 'Potato', market: 'Kolkata APMC', state: 'West Bengal', min_price: 14, max_price: 22, modal_price: 18 },

        { crop: 'Wheat', market: 'Khanna Mandi', state: 'Punjab', min_price: 23, max_price: 27, modal_price: 25 },
        { crop: 'Wheat', market: 'Indore Mandi', state: 'Madhya Pradesh', min_price: 24, max_price: 29, modal_price: 27 },

        { crop: 'Rice', market: 'Karnal Mandi', state: 'Haryana', min_price: 32, max_price: 48, modal_price: 40 },
        { crop: 'Rice', market: 'Raipur Mandi', state: 'Chhattisgarh', min_price: 28, max_price: 42, modal_price: 36 },

        { crop: 'Soybean', market: 'Indore Mandi', state: 'Madhya Pradesh', min_price: 44, max_price: 54, modal_price: 49 },
        { crop: 'Soybean', market: 'Latur Mandi', state: 'Maharashtra', min_price: 46, max_price: 56, modal_price: 52 }
      ];
    }

    res.json({ prices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/weather', (req, res) => {
  try {
    const weather = {
      current: {
        location: 'Pune District, Maharashtra',
        temp: 29,
        condition: 'Partly Cloudy',
        humidity: 68,
        wind: 14
      },
      forecast: [
        { day: 'Mon', icon: '⛅', high: 31, low: 22 },
        { day: 'Tue', icon: '🌦️', high: 29, low: 21 },
        { day: 'Wed', icon: '🌧️', high: 27, low: 20 },
        { day: 'Thu', icon: '🌤️', high: 30, low: 22 },
        { day: 'Fri', icon: '☀️', high: 32, low: 23 }
      ],
      alerts: [
        {
          title: 'Pre-Monsoon Shower Advisory',
          message: 'Moderate rain showers expected in 48 hours. Ensure harvested produce is moved to covered storage.'
        },
        {
          title: 'Cold Chain Precaution',
          message: 'Daytime temperatures exceeding 32°C. Recommended refrigerated transit for tomatoes and berries.'
        }
      ]
    };
    res.json(weather);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pan-India Locations API (Complete 36 States/UTs, 788 Districts, 203,000+ Villages)
let panIndiaLocationsCache = null;
function getPanIndiaLocations() {
  if (!panIndiaLocationsCache) {
    try {
      const fs = require('fs');
      const path = require('path');
      const p = path.join(__dirname, '../data/panIndiaLocations.json');
      if (fs.existsSync(p)) {
        panIndiaLocationsCache = JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    } catch (e) {
      console.error('Error loading panIndiaLocations.json:', e.message);
      panIndiaLocationsCache = {};
    }
  }
  return panIndiaLocationsCache || {};
}

router.get('/locations/states', (req, res) => {
  const locs = getPanIndiaLocations();
  const states = Object.keys(locs).sort();
  res.json({ count: states.length, states });
});

router.get('/locations/districts', (req, res) => {
  const { state } = req.query;
  const locs = getPanIndiaLocations();
  if (!state || !locs[state]) {
    return res.status(400).json({ error: 'Valid state query parameter required', districts: [] });
  }
  const districts = Object.keys(locs[state]).sort();
  res.json({ state, count: districts.length, districts });
});

router.get('/locations/villages', (req, res) => {
  const { state, district, q } = req.query;
  const locs = getPanIndiaLocations();
  
  let villages = [];
  if (state && district && locs[state] && locs[state][district]) {
    villages = locs[state][district];
  } else if (district) {
    // Search across states if state is not provided
    for (const s in locs) {
      if (locs[s][district]) {
        villages = locs[s][district];
        break;
      }
    }
  }

  // Optional query filter for auto-complete search
  if (q && typeof q === 'string' && q.trim()) {
    const term = q.trim().toLowerCase();
    villages = villages.filter(v => v.toLowerCase().includes(term));
  }

  res.json({
    state: state || '',
    district: district || '',
    count: villages.length,
    villages
  });
});

module.exports = router;

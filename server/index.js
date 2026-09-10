const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

async function startServer() {
  // Initialize database (async for sql.js)
  await initDb();

  // API Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/farmers', require('./routes/farmers'));
  app.use('/api/crops', require('./routes/crops'));
  app.use('/api/lots', require('./routes/lots'));
  app.use('/api/master-lots', require('./routes/masterLots'));
  app.use('/api/inventory', require('./routes/inventory'));
  app.use('/api/ai', require('./routes/ai'));
  app.use('/api/buyers', require('./routes/buyers'));
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/dispatches', require('./routes/dispatches'));
  app.use('/api/processing', require('./routes/processing'));
  app.use('/api/payments', require('./routes/payments'));
  app.use('/api/equipment', require('./routes/equipment'));
  app.use('/api/transport', require('./routes/transport'));
  app.use('/api/market', require('./routes/market'));
  app.use('/api/dashboard', require('./routes/dashboard'));
  app.use('/api/tts', require('./routes/tts'));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'CROP2GO', version: '1.0.0' });
  });

  app.listen(PORT, () => {
    console.log(`\n🌾 CROP2GO Server running on http://localhost:${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api\n`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const searchRouter = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET']
}));

app.use(express.json());

// Rate limit: 30 requests per minute per IP
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, slow down.' }
}));

app.use('/api/search', searchRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Archive Engines API', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Archive Engines backend running on port ${PORT}`);
});

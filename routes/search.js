const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const scrapeBuyee = require('../scrapers/buyee');

const cache = new NodeCache({ stdTTL: 1200 });

router.get('/', async (req, res) => {
  const { q, maxPrice, page = 1 } = req.query;
  if (!q || q.trim().length < 2) return res.status(400).json({ error: 'Query too short' });

  const query = q.trim();
  const cacheKey = query + '_' + (maxPrice || 'any') + '_' + page;
  const cached = cache.get(cacheKey);
  if (cached) return res.json({ ...cached, fromCache: true });

  try {
    const listings = await scrapeBuyee({ query, maxPrice, page });
    const filtered = maxPrice ? listings.filter(l => l.price <= parseInt(maxPrice)) : listings;

    const result = {
      query,
      total: filtered.length,
      page: parseInt(page),
      platforms: [{ id: 'buyee', count: filtered.length, error: null }],
      listings: filtered,
      fromCache: false,
      timestamp: new Date().toISOString()
    };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.json({
      query, total: 0, page: 1,
      platforms: [{ id: 'buyee', count: 0, error: err.message }],
      listings: [], fromCache: false,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
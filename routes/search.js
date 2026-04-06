const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const scrapeBuyee = require('../scrapers/buyee');
const scrapeZenmarket = require('../scrapers/zenmarket');

const cache = new NodeCache({ stdTTL: 1200 });

router.get('/', async (req, res) => {
  const { q, maxPrice, page = 1 } = req.query;
  if (!q || q.trim().length < 2) return res.status(400).json({ error: 'Query too short' });

  const query = q.trim();
  const cacheKey = query + '_' + (maxPrice || 'any') + '_' + page;
  const cached = cache.get(cacheKey);
  if (cached) return res.json({ ...cached, fromCache: true });

  const scrapers = [
    { id: 'buyee', fn: scrapeBuyee },
    { id: 'zenmarket', fn: scrapeZenmarket },
  ];

  const results = await Promise.allSettled(
    scrapers.map(s => s.fn({ query, maxPrice, page }))
  );

  const platforms = [];
  let allListings = [];

  results.forEach((result, i) => {
    const { id } = scrapers[i];
    if (result.status === 'fulfilled') {
      const listings = maxPrice
        ? result.value.filter(l => l.price <= parseInt(maxPrice))
        : result.value;
      allListings = allListings.concat(listings);
      platforms.push({ id, count: listings.length, error: null });
    } else {
      platforms.push({ id, count: 0, error: result.reason?.message || 'failed' });
    }
  });

  const response = {
    query,
    total: allListings.length,
    page: parseInt(page),
    platforms,
    listings: allListings,
    fromCache: false,
    timestamp: new Date().toISOString()
  };

  cache.set(cacheKey, response);
  res.json(response);
});

module.exports = router;
const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const scrapeBuyee = require('../scrapers/buyee');
const scrapeZenmarket = require('../scrapers/zenmarket');
const scrapeFromJapan = require('../scrapers/fromjapan');
const scrapeDejapan = require('../scrapers/dejapan');
const scrapeJauce = require('../scrapers/jauce');
const scrapeRemambo = require('../scrapers/remambo');

// Cache results for 20 minutes to avoid hammering proxy sites
const cache = new NodeCache({ stdTTL: 1200 });

// All available scrapers
const SCRAPERS = {
  buyee: scrapeBuyee,
  zenmarket: scrapeZenmarket,
  fromjapan: scrapeFromJapan,
  dejapan: scrapeDejapan,
  jauce: scrapeJauce,
  remambo: scrapeRemambo,
};

// GET /api/search?q=yohji+yamamoto&platforms=buyee,zenmarket&maxPrice=20000&page=1
router.get('/', async (req, res) => {
  const { q, platforms, maxPrice, page = 1 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }

  const query = q.trim();
  const requestedPlatforms = platforms
    ? platforms.split(',').filter(p => SCRAPERS[p])
    : Object.keys(SCRAPERS);

  const cacheKey = `${query}__${requestedPlatforms.join(',')}__${maxPrice || 'any'}__${page}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ ...cached, fromCache: true });
  }

  // Run all scrapers in parallel, don't let one failure kill everything
  const results = await Promise.allSettled(
    requestedPlatforms.map(platform =>
      runScraper(SCRAPERS[platform], { query, maxPrice, page })
        .then(listings => ({ platform, listings, error: null }))
        .catch(err => ({ platform, listings: [], error: err.message }))
    )
  );

  const platformResults = results.map(r => r.value || r.reason);

  // Merge all listings into one flat array, sorted by price ascending
  const allListings = platformResults
    .flatMap(r => r.listings || [])
    .filter(l => !maxPrice || l.price <= parseInt(maxPrice))
    .sort((a, b) => a.price - b.price);

  const response = {
    query,
    total: allListings.length,
    page: parseInt(page),
    platforms: platformResults.map(r => ({
      id: r.platform,
      count: r.listings?.length || 0,
      error: r.error || null
    })),
    listings: allListings,
    fromCache: false,
    timestamp: new Date().toISOString()
  };

  cache.set(cacheKey, response);
  res.json(response);
});

async function runScraper(scraper, options) {
  // Timeout each scraper after 12 seconds
  return Promise.race([
    scraper(options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Scraper timeout')), 12000)
    )
  ]);
}

module.exports = router;

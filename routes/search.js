const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const axios = require('axios');

const cache = new NodeCache({ stdTTL: 1200 });

router.get('/', async (req, res) => {
  const { q, maxPrice, page = 1 } = req.query;
  if (!q || q.trim().length < 2) return res.status(400).json({ error: 'Query too short' });

  const query = q.trim();
  const cacheKey = query + '_' + (maxPrice||'any') + '_' + page;
  const cached = cache.get(cacheKey);
  if (cached) return res.json({ ...cached, fromCache: true });

  try {
    const response = await axios.get('https://api.mercari.jp/v2/entities:search', {
      params: {
        page_token: '',
        search_condition: JSON.stringify({
          keyword: query,
          status: ['STATUS_ON_SALE'],
        }),
        limit: 30,
      },
      headers: {
        'X-Platform': 'web',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    const items = response.data?.items || [];
    const listings = items.map(item => ({
      id: 'mercari_' + item.id,
      platform: 'mercari',
      platformName: 'Mercari Japan',
      title: item.name,
      price: item.price,
      currency: 'JPY',
      image: item.thumbnails?.[0] || null,
      link: 'https://jp.mercari.com/item/' + item.id,
      condition: item.item_condition?.name || 'Unknown',
    }));

    const result = {
      query, total: listings.length, page: parseInt(page),
      platforms: [{ id: 'mercari', count: listings.length, error: null }],
      listings, fromCache: false,
      timestamp: new Date().toISOString()
    };
    cache.set(cacheKey, result);
    res.json(result);
  } catch(err) {
    res.json({
      query, total: 0, page: 1,
      platforms: [{ id: 'mercari', count: 0, error: err.message }],
      listings: [], fromCache: false,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
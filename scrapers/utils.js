
const axios = require('axios');
const cheerio = require('cheerio');

async function fetchHTML(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ja,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
        },
        timeout: 15000,
        maxRedirects: 5,
      });
      return cheerio.load(response.data);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

function parsePrice(str) {
  if (!str) return 0;
  return parseInt(str.replace(/[^0-9]/g, '')) || 0;
}

function resolveImage(src, baseUrl) {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return 'https:' + src;
  try { return new URL(src, baseUrl).href; } catch { return null; }
}

function normaliseCondition(raw) {
  if (!raw) return 'Unknown';
  const r = raw.toLowerCase();
  if (r.includes('new') || r.includes('未使用') || r.includes('新品')) return 'New';
  if (r.includes('like new') || r.includes('美品')) return 'Like New';
  if (r.includes('good') || r.includes('良品')) return 'Good';
  if (r.includes('fair') || r.includes('やや')) return 'Fair';
  if (r.includes('poor') || r.includes('難')) return 'Poor';
  return raw.trim();
}

module.exports = { fetchHTML, parsePrice, resolveImage, normaliseCondition };
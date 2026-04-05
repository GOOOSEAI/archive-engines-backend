
const axios = require('axios');
const cheerio = require('cheerio');

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || 'c63bc2016325b258119cdf1a496bbcc9';

function scraperUrl(url) {
  return `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=false`;
}

async function fetchHTML(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await axios.get(scraperUrl(url), {
        timeout: 30000,
        maxRedirects: 5,
      });
      return cheerio.load(response.data);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

function parsePrice(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[^0-9]/g, '');
  return parseInt(cleaned) || 0;
}

function resolveImage(src, baseUrl) {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return 'https:' + src;
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return null;
  }
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

module.exports = { fetchHTML, parsePrice, resolveImage, normaliseCondition, scraperUrl };
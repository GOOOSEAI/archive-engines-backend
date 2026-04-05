const axios = require('axios');
const cheerio = require('cheerio');
const UserAgent = require('user-agents');

// Rotate user agents so sites don't recognise us as a bot
function getHeaders() {
  const userAgent = new UserAgent({ deviceCategory: 'desktop' });
  return {
    'User-Agent': userAgent.toString(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  };
}

// Fetch HTML from a URL with retry logic
async function fetchHTML(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await axios.get(url, {
        headers: getHeaders(),
        timeout: 10000,
        maxRedirects: 5,
      });
      return cheerio.load(response.data);
    } catch (err) {
      if (i === retries) throw err;
      // Wait 1s before retry
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// Clean price strings like "¥12,500" → 12500
function parsePrice(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[^0-9]/g, '');
  return parseInt(cleaned) || 0;
}

// Resolve relative image URLs
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

// Condition normaliser — maps platform-specific grades to standard labels
function normaliseCondition(raw) {
  if (!raw) return 'Unknown';
  const r = raw.toLowerCase();
  if (r.includes('new') || r.includes('未使用') || r.includes('s級') || r.includes('新品')) return 'New';
  if (r.includes('like new') || r.includes('almost') || r.includes('美品') || r.includes('s')) return 'Like New';
  if (r.includes('good') || r.includes('良品') || r.includes('a')) return 'Good';
  if (r.includes('fair') || r.includes('b') || r.includes('やや')) return 'Fair';
  if (r.includes('poor') || r.includes('c') || r.includes('難')) return 'Poor';
  return raw.trim();
}

module.exports = { fetchHTML, parsePrice, resolveImage, normaliseCondition, getHeaders };

const axios = require('axios');
const cheerio = require('cheerio');

const BASE = 'https://zenmarket.jp';

async function fetchZenmarket(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://zenmarket.jp/en/',
      'Origin': 'https://zenmarket.jp',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Cache-Control': 'max-age=0',
    },
    timeout: 20000,
    maxRedirects: 5,
  });
  return cheerio.load(response.data);
}

module.exports = async function scrapeZenmarket({ query, page = 1 }) {
  const url = `${BASE}/en/mercari.aspx?q=${encodeURIComponent(query)}&p=${page}`;
  const $ = await fetchZenmarket(url);
  const listings = [];

  $('a.product-link').each((_, el) => {
    try {
      const $el = $(el);
      const title = $el.find('.item-title').text().trim();
      const href = $el.attr('href');
      const link = href ? (href.startsWith('http') ? href : BASE + '/en/' + href) : null;
      const priceText = $el.find('.amount').first().attr('data-jpy') || '';
      const nums = priceText.match(/[\d,]+/g) || [];
      const price = nums.length > 0 ? parseInt(nums[0].replace(/,/g, '')) : 0;
      const imgSrc = $el.find('.img-wrap img').first().attr('src');
      const image = imgSrc || null;
      if (title && title.length > 3 && link) {
        listings.push({
          id: `zenmarket_${Buffer.from(link).toString('base64').slice(0, 12)}`,
          platform: 'zenmarket', platformName: 'Zenmarket',
          title, price: price || 1, currency: 'JPY', image, link, condition: 'Unknown'
        });
      }
    } catch (e) {}
  });

  return listings;
};
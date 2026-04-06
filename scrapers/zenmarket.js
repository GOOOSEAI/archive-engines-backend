const { fetchHTML } = require('./utils');
const BASE = 'https://zenmarket.jp';

module.exports = async function scrapeZenmarket({ query, page = 1 }) {
  const url = `${BASE}/en/mercari.aspx?q=${encodeURIComponent(query)}&p=${page}`;
  const $ = await fetchHTML(url);
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
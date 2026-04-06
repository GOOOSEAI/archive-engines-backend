const { fetchHTML } = require('./utils');
const BASE = 'https://buyee.jp';

module.exports = async function scrapeBuyee({ query, maxPrice, page = 1 }) {
  const url = `${BASE}/item/search?query=${encodeURIComponent(query)}&page=${page}${maxPrice ? `&maxPrice=${maxPrice}` : ''}`;
  const $ = await fetchHTML(url);
  const listings = [];

  $('li.itemCard').each((_, el) => {
    try {
      const $el = $(el);
      const titleEl = $el.find('.itemCard__itemName a').first();
      const title = titleEl.text().trim();
      const href = titleEl.attr('href');
      const link = href ? (href.startsWith('http') ? href : BASE + href) : null;
      const priceText = $el.find('.g-price').first().text().trim();
      const nums = priceText.match(/[\d,]+/g) || [];
      const price = nums.length > 0 ? parseInt(nums[0].replace(/,/g, '')) : 0;
      const imgSrc = $el.find('img').first().attr('data-src');
      const image = imgSrc && !imgSrc.includes('spacer') ? imgSrc : null;
      if (title && title.length > 3 && link) {
        listings.push({
          id: `buyee_${Buffer.from(link).toString('base64').slice(0, 12)}`,
          platform: 'buyee', platformName: 'Buyee',
          title, price: price || 1, currency: 'JPY', image, link, condition: 'Unknown'
        });
      }
    } catch (e) {}
  });

  return listings;
};
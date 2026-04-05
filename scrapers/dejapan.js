const { fetchHTML, parsePrice, resolveImage, normaliseCondition } = require('./utils');

const BASE = 'https://dejapan.com';

module.exports = async function scrapeDejapan({ query, maxPrice, page = 1 }) {
  const url = `${BASE}/search?search=${encodeURIComponent(query)}&page=${page}${maxPrice ? `&max_price=${maxPrice}` : ''}`;
  const $ = await fetchHTML(url);

  const listings = [];

  $('.product, .item, [class*="product-item"], [class*="search-result"]').each((_, el) => {
    try {
      const $el = $(el);

      const title = $el.find('.product-title, .item-title, h3, h4').first().text().trim();
      const priceText = $el.find('.product-price, .price').first().text().trim();
      const price = parsePrice(priceText);
      const imgSrc = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
      const image = resolveImage(imgSrc, BASE);
      const href = $el.find('a').first().attr('href');
      const link = href ? (href.startsWith('http') ? href : BASE + href) : null;
      const conditionText = $el.find('[class*="condition"], [class*="grade"]').first().text().trim();
      const condition = normaliseCondition(conditionText);

      if (title && price > 0 && link) {
        listings.push({
          id: `dejapan_${Buffer.from(link).toString('base64').slice(0, 12)}`,
          platform: 'dejapan',
          platformName: 'Dejapan',
          title,
          price,
          currency: 'JPY',
          image,
          link,
          condition,
          raw: { priceText, conditionText }
        });
      }
    } catch (e) {}
  });

  return listings;
};

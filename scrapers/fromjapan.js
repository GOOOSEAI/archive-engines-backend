const { fetchHTML, parsePrice, resolveImage, normaliseCondition } = require('./utils');

const BASE = 'https://www.fromjapan.co.jp';

module.exports = async function scrapeFromJapan({ query, maxPrice, page = 1 }) {
  const url = `${BASE}/en/special/search/index/?keyword=${encodeURIComponent(query)}&page=${page}${maxPrice ? `&price_max=${maxPrice}` : ''}`;
  const $ = await fetchHTML(url);

  const listings = [];

  $('.item-box, .search-item, [class*="item-box"]').each((_, el) => {
    try {
      const $el = $(el);

      const title = $el.find('.item-name, .item-title, h3').first().text().trim();
      const priceText = $el.find('.item-price, .price').first().text().trim();
      const price = parsePrice(priceText);
      const imgSrc = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
      const image = resolveImage(imgSrc, BASE);
      const href = $el.find('a').first().attr('href');
      const link = href ? (href.startsWith('http') ? href : BASE + href) : null;
      const conditionText = $el.find('[class*="condition"]').first().text().trim();
      const condition = normaliseCondition(conditionText);

      if (title && price > 0 && link) {
        listings.push({
          id: `fromjapan_${Buffer.from(link).toString('base64').slice(0, 12)}`,
          platform: 'fromjapan',
          platformName: 'FROM JAPAN',
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

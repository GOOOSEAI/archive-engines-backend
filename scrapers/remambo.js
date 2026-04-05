const { fetchHTML, parsePrice, resolveImage, normaliseCondition } = require('./utils');

const BASE = 'https://remambo.jp';

module.exports = async function scrapeRemambo({ query, maxPrice, page = 1 }) {
  const url = `${BASE}/search/?query=${encodeURIComponent(query)}&page=${page}${maxPrice ? `&price_to=${maxPrice}` : ''}`;
  const $ = await fetchHTML(url);

  const listings = [];

  $('.item-card, .lot, [class*="item-card"], [class*="lot-item"]').each((_, el) => {
    try {
      const $el = $(el);

      const title = $el.find('.lot-title, .item-title, h3').first().text().trim();
      const priceText = $el.find('.price, [class*="price"]').first().text().trim();
      const price = parsePrice(priceText);
      const imgSrc = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
      const image = resolveImage(imgSrc, BASE);
      const href = $el.find('a').first().attr('href');
      const link = href ? (href.startsWith('http') ? href : BASE + href) : null;
      const conditionText = $el.find('[class*="condition"], [class*="grade"]').first().text().trim();
      const condition = normaliseCondition(conditionText);

      if (title && price > 0 && link) {
        listings.push({
          id: `remambo_${Buffer.from(link).toString('base64').slice(0, 12)}`,
          platform: 'remambo',
          platformName: 'Remambo',
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

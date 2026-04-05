const { fetchHTML, parsePrice, resolveImage, normaliseCondition } = require('./utils');

const BASE = 'https://buyee.jp';

module.exports = async function scrapeBuyee({ query, maxPrice, page = 1 }) {
  const url = `${BASE}/item/search?query=${encodeURIComponent(query)}&page=${page}${maxPrice ? `&maxPrice=${maxPrice}` : ''}`;
  const $ = await fetchHTML(url);

  const listings = [];

  // Buyee search result items
  $('.itemCard, .search-result-item, [class*="itemCard"]').each((_, el) => {
    try {
      const $el = $(el);

      const title = $el.find('[class*="itemCard__itemName"], .itemName, h3').first().text().trim();
      const priceText = $el.find('[class*="itemCard__price"], .price, [class*="price"]').first().text().trim();
      const price = parsePrice(priceText);
      const imgSrc = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
      const image = resolveImage(imgSrc, BASE);
      const href = $el.find('a').first().attr('href');
      const link = href ? (href.startsWith('http') ? href : BASE + href) : null;
      const conditionText = $el.find('[class*="condition"], [class*="grade"]').first().text().trim();
      const condition = normaliseCondition(conditionText);

      if (title && price > 0 && link) {
        listings.push({
          id: `buyee_${Buffer.from(link).toString('base64').slice(0, 12)}`,
          platform: 'buyee',
          platformName: 'Buyee',
          title,
          price,
          currency: 'JPY',
          image,
          link,
          condition,
          raw: { priceText, conditionText }
        });
      }
    } catch (e) {
      // Skip malformed listing
    }
  });

  return listings;
};

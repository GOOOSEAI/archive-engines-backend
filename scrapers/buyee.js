const { fetchHTML, parsePrice, resolveImage, normaliseCondition } = require('./utils');

const BASE = 'https://buyee.jp';

module.exports = async function scrapeBuyee({ query, maxPrice, page = 1 }) {
  const url = `${BASE}/item/search?query=${encodeURIComponent(query)}&page=${page}${maxPrice ? `&maxPrice=${maxPrice}` : ''}`;
  const $ = await fetchHTML(url);

  const listings = [];

  $('.itemCard, .search-result-item, [class*="itemCard"]').each((_, el) => {
    try {
      const $el = $(el);

      const title = $el.find('[class*="itemCard__itemName"], .itemName, h3').first().text().trim();
      
      // Get only the current price, not buyout price
      const priceRaw = $el.find('[class*="itemCard__price"], .price').first().text().trim();
const allNumbers = priceRaw.match(/[\d,]+/g) || [];
const price = allNumbers.length > 0 ? parseInt(allNumbers[0].replace(/,/g, '')) : 0;      // Try multiple image attributes for lazy-loaded images
      const imgEl = $el.find('img').first();
      const imgSrc = imgEl.attr('data-src') || 
                     imgEl.attr('data-lazy') || 
                     imgEl.attr('data-original') ||
                     imgEl.attr('src');
      const image = imgSrc && !imgSrc.includes('spacer') ? resolveImage(imgSrc, BASE) : null;

      const href = $el.find('a').first().attr('href');
      const link = href ? (href.startsWith('http') ? href : BASE + href) : null;
// Extract item ID and construct thumbnail URL
const itemIdMatch = link ? link.match(/auction\/([a-z0-9]+)/) : null;
const image = itemIdMatch 
  ? `https://auctions.c.yimg.jp/images.auctions.yahoo.co.jp/image/dr000/auc0504/users/${itemIdMatch[1]}/i-img600x600.jpg`
  : null;
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
        });
      }
    } catch (e) {}
  });

  return listings;
};
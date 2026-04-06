const { fetchHTML } = require('./utils');
const BASE = 'https://buyee.jp';

module.exports = async function scrapeBuyee({ query, maxPrice, page = 1 }) {
  const url = `${BASE}/item/search?query=${encodeURIComponent(query)}&page=${page}`;
  const $ = await fetchHTML(url);
  
  // Debug: count how many elements we can find
  const allDivs = $('div').length;
  const itemCards = $('.itemCard__itemInfo').length;
  const bodyText = $('body').text().slice(0, 200);
  
  return [{
    id: 'debug',
    platform: 'buyee',
    platformName: 'Buyee DEBUG',
    title: `divs:${allDivs} itemCards:${itemCards} body:${bodyText}`,
    price: 1,
    currency: 'JPY',
    image: null,
    link: url,
    condition: 'Unknown'
  }];
};
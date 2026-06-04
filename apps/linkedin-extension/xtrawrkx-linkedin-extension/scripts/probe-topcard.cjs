/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const cheerio = require(path.join(__dirname, '../../xtrawrkx-linkedin-extract-api/node_modules/cheerio'));

const $ = cheerio.load(fs.readFileSync(path.join(__dirname, 'sample-profile.html'), 'utf8'));

const nameH = $('h2').filter((_, el) => $(el).text().trim() === 'Arastu Gupta').first();
const card = nameH.closest('section').length ? nameH.closest('section') : nameH.parent().parent().parent().parent();
console.log('card tag', card.get(0)?.name, 'text len', card.text().length);

const text = card.text().replace(/\s+/g, ' ').trim();
console.log('card text preview:', text.slice(0, 600));

// split by common patterns
const fol = text.match(/([\d,.+]+)\s+followers/i);
const con = text.match(/([\d,.+]+)\+?\s+connections/i);
console.log('fol', fol, 'con', con);

// all p in card
card.find('p').each((i, p) => {
  const t = $(p).text().replace(/\s+/g, ' ').trim();
  if (t) console.log(`p[${i}]`, t.slice(0, 150));
});

// aria-hidden in card
const aria = [];
card.find('span[aria-hidden="true"]').each((_, s) => {
  const t = $(s).text().replace(/\s+/g, ' ').trim();
  if (t.length > 2 && t.length < 200) aria.push(t);
});
console.log('aria unique', [...new Set(aria)].slice(0, 25));

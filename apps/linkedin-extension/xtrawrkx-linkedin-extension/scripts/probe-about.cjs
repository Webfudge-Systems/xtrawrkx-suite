/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const cheerio = require(path.join(__dirname, '../../xtrawrkx-linkedin-extract-api/node_modules/cheerio'));

const $ = cheerio.load(fs.readFileSync(path.join(__dirname, 'sample-profile.html'), 'utf8'));

const aboutH = $('h2').filter((_, el) => $(el).text().trim() === 'About').first();
console.log('about h2 found', aboutH.length);

let el = aboutH;
for (let d = 0; d < 8; d++) {
  el = el.parent();
  const allText = el.text().replace(/\s+/g, ' ').trim();
  console.log(`parent depth ${d} len=${allText.length}`, allText.slice(0, 200));
}

// walk next siblings from about header parent
const container = aboutH.parent().parent();
console.log('sibling count', container.siblings().length);
container.parent().children().each((i, child) => {
  const t = $(child).text().replace(/\s+/g, ' ').trim();
  if (t.length > 20 && t.length < 500) console.log(`child[${i}]`, t.slice(0, 200));
});

// all p tags with substantial text in document
const paras = [];
$('p').each((_, p) => {
  const t = $(p).text().replace(/\s+/g, ' ').trim();
  if (t.length > 40 && t.length < 2000) paras.push(t);
});
console.log('\nlong paragraphs', paras.length);
paras.slice(0, 5).forEach((p, i) => console.log(`p[${i}]`, p.slice(0, 250)));

// followers context
const idx = $.html().indexOf('followers');
if (idx > 0) console.log('\nfollowers ctx', $.html().slice(idx - 100, idx + 80).replace(/\s+/g, ' '));

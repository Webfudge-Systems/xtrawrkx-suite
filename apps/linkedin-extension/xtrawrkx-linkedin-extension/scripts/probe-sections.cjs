/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const cheerio = require(path.join(
  __dirname,
  '../../xtrawrkx-linkedin-extract-api/node_modules/cheerio',
));

const html = fs.readFileSync(path.join(__dirname, 'sample-profile.html'), 'utf8');
const $ = cheerio.load(html);

// Find h2/h3 with exact section names
function findSection(label) {
  const headers = $('h2, h3').filter((_, el) => $(el).text().trim() === label);
  console.log(`\n=== ${label} headers: ${headers.length} ===`);
  headers.each((i, el) => {
    let node = $(el).parent();
    for (let d = 0; d < 6; d++) {
      const ariaSpans = node.find('span[aria-hidden="true"]');
      const texts = [];
      ariaSpans.each((_, s) => {
        const t = $(s).text().replace(/\s+/g, ' ').trim();
        if (t.length > 2 && t.length < 200 && !texts.includes(t)) texts.push(t);
      });
      if (texts.length > 3) {
        console.log(`header[${i}] depth${d} aria texts (${texts.length}):`, texts.slice(0, 15));
        break;
      }
      node = node.parent();
    }
  });
}

findSection('About');
findSection('Arastu Gupta');

// profile top: first h2 that looks like a name (not notifications etc)
$('h2').each((i, el) => {
  const t = $(el).text().trim();
  if (t && t.length < 60 && !/notification|premium|activity|featured|ad options/i.test(t)) {
    console.log(`h2[${i}]`, t);
  }
});

// paragraphs near name
const nameH2 = $('h2').filter((_, el) => $(el).text().trim() === 'Arastu Gupta').first();
if (nameH2.length) {
  const card = nameH2.closest('div').parent().parent();
  const ps = card.find('p, span[aria-hidden="true"]');
  const lines = [];
  ps.each((_, p) => {
    const t = $(p).text().replace(/\s+/g, ' ').trim();
    if (t && t.length < 300) lines.push(t);
  });
  console.log('\nNear name texts (unique):', [...new Set(lines)].slice(0, 20));
}

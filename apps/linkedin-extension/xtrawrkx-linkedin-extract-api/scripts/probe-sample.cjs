/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const html = fs.readFileSync(
  path.join(__dirname, '../../xtrawrkx-linkedin-extension/scripts/sample-profile.html'),
  'utf8',
);
const $ = cheerio.load(html);

console.log('h1', $('h1').length);
$('h1').each((i, el) => {
  console.log(`h1[${i}]`, $(el).text().replace(/\s+/g, ' ').trim().slice(0, 80));
});

const sels = [
  '.text-heading-xlarge',
  '.text-heading-large',
  '.text-body-medium.break-words',
  '.text-body-medium',
  '.text-body-small.inline.t-black--light',
  '#about',
  '#experience',
  '#education',
  '#skills',
  'main h1',
];

for (const sel of sels) {
  const n = $(sel).length;
  if (n) {
    console.log(sel, n, $(sel).first().text().replace(/\s+/g, ' ').trim().slice(0, 100));
  }
}

$('script[type="application/ld+json"]').each((i, el) => {
  try {
    const j = JSON.parse($(el).html() || '{}');
    console.log(`ld[${i}]`, j['@type'], Object.keys(j).join(','));
  } catch {
    console.log(`ld[${i}] parse error`);
  }
});

const ids = new Set();
$('[id]').each((_, el) => {
  const id = $(el).attr('id');
  if (id && /about|experience|education|skill|top|profile/i.test(id)) ids.add(id);
});
console.log('interesting ids', [...ids].slice(0, 30));

// class patterns with heading
const classes = new Set();
$('[class]').each((_, el) => {
  const c = $(el).attr('class') || '';
  if (/heading|headline|top-card|profile/i.test(c)) classes.add(c.split(/\s+/).filter((x) => /heading|headline|top-card|profile/i.test(x)).join(' '));
});
console.log('heading-related classes sample', [...classes].slice(0, 20));

// Experience section: find h2 with text Experience
$('h2, h3, span').each((_, el) => {
  const t = $(el).text().trim();
  if (t === 'Experience' || t === 'Education' || t === 'About' || t === 'Skills') {
    const parent = $(el).parent().parent();
    console.log('section', t, 'parent tag', parent.get(0)?.name, 'siblings', parent.siblings().length);
  }
});

// aria-hidden spans in first experience area
const expAnchor = $('#experience');
console.log('#experience exists', expAnchor.length);
if (expAnchor.length) {
  const section = expAnchor.closest('section').length ? expAnchor.closest('section') : expAnchor.parent().parent();
  const spans = section.find('span[aria-hidden="true"]');
  console.log('exp aria spans', spans.length);
  spans.slice(0, 12).each((i, el) => {
    const tx = $(el).text().replace(/\s+/g, ' ').trim();
    if (tx.length > 2 && tx.length < 120) console.log(`  span[${i}]`, tx);
  });
}

const bodyText = $('body').text().replace(/\s+/g, ' ');
const fol = bodyText.match(/([\d,.+]+)\s+followers/i);
const con = bodyText.match(/([\d,.+]+)\s+connections/i);
console.log('followers', fol && fol[0]);
console.log('connections', con && con[0]);

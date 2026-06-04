/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const htmlPath = path.join(__dirname, 'sample-profile.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const dom = new JSDOM(html);
const doc = dom.window.document;

function t(sel) {
  const el = doc.querySelector(sel);
  return el ? el.textContent.replace(/\s+/g, ' ').trim().slice(0, 120) : null;
}

console.log('h1 count', doc.querySelectorAll('h1').length);
doc.querySelectorAll('h1').forEach((h, i) => {
  console.log(`h1[${i}]`, h.textContent.replace(/\s+/g, ' ').trim().slice(0, 80));
});

const selectors = [
  '.text-heading-xlarge',
  '.text-heading-large',
  '.text-body-medium.break-words',
  '.text-body-medium',
  '.text-body-small.inline.t-black--light',
  '.text-body-small',
  '#about',
  '#experience',
  '#education',
  '#skills',
  'section',
  '[id="about"]',
  '[id="experience"]',
];

for (const sel of selectors) {
  const n = doc.querySelectorAll(sel).length;
  if (n) console.log(sel, n, 'first:', t(sel));
}

// JSON-LD
const ld = doc.querySelectorAll('script[type="application/ld+json"]');
console.log('ld+json scripts', ld.length);
ld.forEach((s, i) => {
  try {
    const j = JSON.parse(s.textContent);
    console.log(`ld[${i}] keys`, Object.keys(j));
    console.log(JSON.stringify(j, null, 2).slice(0, 500));
  } catch (e) {
    console.log(`ld[${i}] parse err`);
  }
});

// followers / connections text
const bodyText = doc.body ? doc.body.textContent : '';
const fol = bodyText.match(/([\d,+.]+)\s+followers/i);
const con = bodyText.match(/([\d,+.]+)\s+connections/i);
console.log('followers match', fol && fol[0]);
console.log('connections match', con && con[0]);

// Find elements containing Experience heading
const all = [...doc.querySelectorAll('*')].filter((el) => {
  const tx = el.textContent.trim();
  return tx === 'Experience' && el.children.length === 0;
});
console.log('Experience label nodes', all.length);

// anchor ids
const ids = [...doc.querySelectorAll('[id]')].map((e) => e.id).filter(Boolean);
const interesting = ids.filter((id) => /about|experience|education|skill|top/i.test(id));
console.log('interesting ids', interesting.slice(0, 30));

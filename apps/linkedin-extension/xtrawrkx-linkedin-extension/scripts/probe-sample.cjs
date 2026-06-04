/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'sample-profile.html'), 'utf8');

// Title from document
const titleM = html.match(/<title[^>]*>([^<]+)<\/title>/i);
console.log('title', titleM && titleM[1]);

// aria-label patterns
const ariaLabels = [...html.matchAll(/aria-label="([^"]{5,120})"/g)].map((m) => m[1]);
const uniqAria = [...new Set(ariaLabels)].filter((a) => /profile|invite|follow|connect|experience|education|skill|about|mohammad/i.test(a));
console.log('interesting aria-labels', uniqAria.slice(0, 25));

// followers
const fol = html.match(/([\d,.+]+)\s+followers/i);
const con = html.match(/([\d,.+]+)\+?\s+connections/i);
const con2 = html.match(/(500\+|1,000\+|\d[\d,]*\+?)\s+connections/i);
console.log('followers', fol && fol[0], 'connections', (con && con[0]) || (con2 && con2[0]));

// Section headers as visible text in p or span - look for Experience
for (const label of ['Experience', 'Education', 'About', 'Skills', 'Licenses']) {
  const re = new RegExp(`>${label}<`, 'i');
  console.log(label, re.test(html) ? 'found' : 'missing');
}

// code bpr-guid blocks
const codeIds = [...html.matchAll(/<code[^>]*id="([^"]+)"[^>]*>/g)].map((m) => m[1]).slice(0, 15);
console.log('code ids sample', codeIds);

// Try find profile name near top - look for mohammad
const nameIdx = html.toLowerCase().indexOf('mohammad');
console.log('mohammad index', nameIdx);
if (nameIdx > 0) {
  console.log('context', html.slice(nameIdx - 80, nameIdx + 120).replace(/\s+/g, ' '));
}

// og tags
const og = [...html.matchAll(/<meta[^>]+property="og:([^"]+)"[^>]+content="([^"]*)"/g)];
og.forEach((m) => console.log('og:' + m[1], m[2].slice(0, 100)));

// all h2/h3 text
const headings = [...html.matchAll(/<h[23][^>]*>([^<]{2,80})</g)].map((m) => m[1].trim()).filter(Boolean);
console.log('h2/h3 texts', [...new Set(headings)].slice(0, 30));

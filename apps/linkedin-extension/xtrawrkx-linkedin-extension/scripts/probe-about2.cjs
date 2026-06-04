/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const cheerio = require(path.join(__dirname, '../../xtrawrkx-linkedin-extract-api/node_modules/cheerio'));

const $ = cheerio.load(fs.readFileSync(path.join(__dirname, 'sample-profile.html'), 'utf8'));

const aboutH = $('h2').filter((_, el) => $(el).text().trim() === 'About').first();
const section = aboutH.parent().parent();
section.find('p').each((i, p) => {
  console.log(`about p[${i}]`, $(p).text().replace(/\s+/g, ' ').trim().slice(0, 300));
});

// Check if Experience exists anywhere as text
['Experience', 'Education', 'Skills', 'Licenses & certifications'].forEach((label) => {
  const n = $('h2, h3').filter((_, el) => $(el).text().trim() === label).length;
  console.log(label, n);
});

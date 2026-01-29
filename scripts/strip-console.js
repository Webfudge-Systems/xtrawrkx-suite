#!/usr/bin/env node
/**
 * One-off script: remove console.log, console.debug, console.info (single-line) from js/jsx.
 * Keeps console.error and console.warn.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dirs = [
  'xtrawrkx-accounts/src',
  'xtrawrkx-backend-strapi/src',
  'xtrawrkx-backend-strapi/scripts',
  'xtrawrkx-client-portal/src',
  'xtrawrkx-crm-portal/src',
  'xtrawrkx-linkedin-extension/src',
  'xtrawrkx-linkedin-extension/scripts',
  'xtrawrkx-pm-dashboard/src',
];

const singleLineLog = /^\s*console\.(log|debug|info)\s*\([^;]*\);\s*$/;
const startOfLog = /^\s*console\.(log|debug|info)\s*\(/;

function stripFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (singleLineLog.test(line)) {
      i++;
      continue;
    }
    if (startOfLog.test(line)) {
      let combined = line;
      let j = i;
      while (j < lines.length && !/;\s*$/.test(combined)) {
        j++;
        if (j < lines.length) combined += '\n' + lines[j];
      }
      if (/;\s*$/.test(combined)) {
        i = j + 1;
        continue;
      }
    }
    out.push(line);
    i++;
  }
  const newContent = out.join('\n');
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }
  return false;
}

let count = 0;
dirs.forEach((dir) => {
  const fullDir = path.join(root, dir);
  if (!fs.existsSync(fullDir)) return;
  function walk(d) {
    fs.readdirSync(d).forEach((name) => {
      const p = path.join(d, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (/\.(js|jsx)$/.test(name)) {
        if (stripFile(p)) count++;
      }
    });
  }
  walk(fullDir);
});

console.log('Cleaned', count, 'files');

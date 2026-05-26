const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, '..', '.tmp', 'data.db'));

try {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all()
    .map((r) => r.name);

  const interesting = tables.filter(
    (t) => t.includes('xtrawrkx') || t.includes('user_role') || t.includes('department')
  );

  for (const t of interesting) {
    console.log(`\n[${t}]`);
    const cols = db.prepare(`PRAGMA table_info(${t})`).all();
    console.log(cols.map((c) => c.name).join(', '));
  }
} finally {
  db.close();
}

const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const email = process.env.SUPERADMIN_EMAIL || 'admin@xtrawrkx.local';
const password = process.env.SUPERADMIN_PASSWORD || 'Xtrawrkx@12345';
const firstname = process.env.SUPERADMIN_FIRSTNAME || 'Super';
const lastname = process.env.SUPERADMIN_LASTNAME || 'Admin';
const username = process.env.SUPERADMIN_USERNAME || 'superadmin';
const resetExistingPassword = process.env.RESET_EXISTING_PASSWORD === 'true';

const dbPath = path.join(__dirname, '..', '.tmp', 'data.db');
const db = new Database(dbPath);

try {
  const role = db
    .prepare("SELECT id, code, name FROM admin_roles WHERE code = 'strapi-super-admin' LIMIT 1")
    .get();

  if (!role) {
    throw new Error("Could not find 'strapi-super-admin' role in admin_roles.");
  }

  const existing = db.prepare('SELECT id FROM admin_users WHERE email = ? LIMIT 1').get(email);

  let userId = existing ? Number(existing.id) : null;
  if (!userId) {
    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    const insertUser = db.prepare(`
      INSERT INTO admin_users
        (firstname, lastname, username, email, password, is_active, blocked, prefered_language, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, ?, 1, 0, 'en', ?, ?)
    `);

    const result = insertUser.run(firstname, lastname, username, email, passwordHash, now, now);
    userId = Number(result.lastInsertRowid);
  } else if (resetExistingPassword) {
    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();
    db.prepare('UPDATE admin_users SET password = ?, updated_at = ? WHERE id = ?').run(passwordHash, now, userId);
  }

  const existingRoleLink = db
    .prepare('SELECT id FROM admin_users_roles_lnk WHERE user_id = ? AND role_id = ? LIMIT 1')
    .get(userId, role.id);

  if (!existingRoleLink) {
    db.prepare('INSERT INTO admin_users_roles_lnk (user_id, role_id, user_ord, role_ord) VALUES (?, ?, ?, ?)')
      .run(userId, role.id, 1, 1);
  }

  console.log(existing ? 'Super admin already existed. Role link ensured.' : 'Super admin created successfully.');
  console.log(`Email: ${email}`);
  if (!existing || resetExistingPassword) {
    console.log(`Password: ${password}`);
  } else {
    console.log('Password: (unchanged for existing user)');
  }
  console.log(`User ID: ${userId}`);
} finally {
  db.close();
}

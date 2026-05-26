const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const email = (process.env.INTERNAL_USER_EMAIL || 'superadmin@xtrawrkx.com').toLowerCase();
const password = process.env.INTERNAL_USER_PASSWORD || 'Xtrawrkx@12345';
const firstName = process.env.INTERNAL_USER_FIRSTNAME || 'Xtrawrkx';
const lastName = process.env.INTERNAL_USER_LASTNAME || 'Super Admin';
const roleName = process.env.INTERNAL_USER_ROLE || 'Super Admin';
const requireActiveDepartment = process.env.REQUIRE_ACTIVE_DEPARTMENT !== 'false';

const dbPath = path.join(__dirname, '..', '.tmp', 'data.db');
const db = new Database(dbPath);

function getRole() {
  let role = db
    .prepare('SELECT id, name, is_system_role AS isSystemRole FROM user_roles WHERE lower(name) = lower(?) LIMIT 1')
    .get(roleName);

  if (!role) {
    role = db
      .prepare("SELECT id, name, is_system_role AS isSystemRole FROM user_roles WHERE lower(name) = 'super admin' LIMIT 1")
      .get();
  }

  if (!role) {
    throw new Error(`Role "${roleName}" was not found in user_roles.`);
  }

  return role;
}

function getDepartmentId() {
  const row = requireActiveDepartment
    ? db.prepare('SELECT id FROM departments WHERE is_active = 1 ORDER BY id LIMIT 1').get()
    : db.prepare('SELECT id FROM departments ORDER BY id LIMIT 1').get();
  return row?.id ?? null;
}

function findRoleLinkTable() {
  return 'user_roles_users_lnk';
}

function findPrimaryRoleLinkTable() {
  return 'xtrawrkx_users_primary_role_lnk';
}

function findDepartmentLinkTable() {
  return 'xtrawrkx_users_department_lnk';
}

try {
  const role = getRole();
  const departmentId = getDepartmentId();

  const existingUser = db
    .prepare('SELECT id, email FROM xtrawrkx_users WHERE lower(email) = lower(?) LIMIT 1')
    .get(email);

  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(password, 12);
  let userId;

  if (existingUser) {
    userId = Number(existingUser.id);
    db.prepare(`
      UPDATE xtrawrkx_users
      SET first_name = ?,
          last_name = ?,
          password = ?,
          is_active = 1,
          email_verified = 1,
          auth_provider = 'PASSWORD',
          updated_at = ?
      WHERE id = ?
    `).run(firstName, lastName, passwordHash, now, userId);
  } else {
    const result = db.prepare(`
      INSERT INTO xtrawrkx_users
        (email, first_name, last_name, password, is_active, email_verified, auth_provider, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, 1, 1, 'PASSWORD', ?, ?)
    `).run(email, firstName, lastName, passwordHash, now, now);
    userId = Number(result.lastInsertRowid);
  }

  // Ensure many-to-many role relation (userRoles) exists.
  const roleLinkTable = findRoleLinkTable();
  if (roleLinkTable) {
    const linkExists = db
      .prepare(`SELECT id FROM ${roleLinkTable} WHERE xtrawrkx_user_id = ? AND user_role_id = ? LIMIT 1`)
      .get(userId, role.id);

    if (!linkExists) {
      db.prepare(`INSERT INTO ${roleLinkTable} (xtrawrkx_user_id, user_role_id, xtrawrkx_user_ord, user_role_ord) VALUES (?, ?, ?, ?)`)
        .run(userId, role.id, 1, 1);
    }
  }

  // Ensure primaryRole relation exists.
  const primaryRoleLinkTable = findPrimaryRoleLinkTable();
  const existingPrimary = db
    .prepare(`SELECT id FROM ${primaryRoleLinkTable} WHERE xtrawrkx_user_id = ? LIMIT 1`)
    .get(userId);
  if (existingPrimary) {
    db.prepare(`UPDATE ${primaryRoleLinkTable} SET user_role_id = ?, xtrawrkx_user_ord = 1 WHERE id = ?`)
      .run(role.id, existingPrimary.id);
  } else {
    db.prepare(`INSERT INTO ${primaryRoleLinkTable} (xtrawrkx_user_id, user_role_id, xtrawrkx_user_ord) VALUES (?, ?, ?)`)
      .run(userId, role.id, 1);
  }

  // Ensure department relation if a department exists.
  if (departmentId) {
    const departmentLinkTable = findDepartmentLinkTable();
    const existingDepartment = db
      .prepare(`SELECT id FROM ${departmentLinkTable} WHERE xtrawrkx_user_id = ? LIMIT 1`)
      .get(userId);
    if (existingDepartment) {
      db.prepare(`UPDATE ${departmentLinkTable} SET department_id = ?, xtrawrkx_user_ord = 1 WHERE id = ?`)
        .run(departmentId, existingDepartment.id);
    } else {
      db.prepare(`INSERT INTO ${departmentLinkTable} (xtrawrkx_user_id, department_id, xtrawrkx_user_ord) VALUES (?, ?, ?)`)
        .run(userId, departmentId, 1);
    }
  }

  console.log('Internal Xtrawrkx user is ready for CRM/PM login.');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Primary role: ${role.name}`);
  console.log(`User ID: ${userId}`);
} finally {
  db.close();
}

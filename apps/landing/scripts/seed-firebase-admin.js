'use strict';

/**
 * Create or reset the Firebase CMS admin user (landing /admin/login).
 *
 * Usage (from repo root):
 *   npm run seed:firebase-admin -w @xtrawrkx/landing
 *
 * When the user already exists with a wrong password, provide a service account:
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/serviceAccount.json npm run seed:firebase-admin -w @xtrawrkx/landing
 *
 * Optional env overrides:
 *   FIREBASE_ADMIN_EMAIL      (default: admin@xtrawrkx.com)
 *   FIREBASE_ADMIN_PASSWORD   (default: password1234)
 */

const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  for (const name of ['.env.local', '.env.production', '.env']) {
    const envPath = path.join(__dirname, '..', name);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnvFile();

const email = (process.env.FIREBASE_ADMIN_EMAIL || 'admin@xtrawrkx.com').trim().toLowerCase();
const password = process.env.FIREBASE_ADMIN_PASSWORD || 'password1234';
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

async function tryRestSignIn() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (res.ok) return { ok: true, data };
  return { ok: false, error: data?.error?.message };
}

async function tryRestSignUp() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (res.ok) return { ok: true, data };
  return { ok: false, error: data?.error?.message };
}

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (filePath && fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

async function upsertWithAdminSdk() {
  const admin = require('firebase-admin');
  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    throw new Error(
      [
        'Firebase user exists but password does not match.',
        'Download a service account key from Firebase Console:',
        '  Project settings → Service accounts → Generate new private key',
        'Then run:',
        '  FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccount.json npm run seed:firebase-admin -w @xtrawrkx/landing',
      ].join('\n')
    );
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  try {
    const existing = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(existing.uid, {
      password,
      emailVerified: true,
    });
    console.log(`Updated password for ${email} (uid: ${existing.uid})`);
    return existing;
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    const created = await admin.auth().createUser({
      email,
      password,
      emailVerified: true,
      displayName: 'CMS Admin',
    });
    console.log(`Created ${email} (uid: ${created.uid})`);
    return created;
  }
}

async function main() {
  if (!apiKey) {
    console.error('Missing NEXT_PUBLIC_FIREBASE_API_KEY in apps/landing env.');
    process.exit(1);
  }

  console.log(`\n--- Firebase CMS admin: ${email} ---\n`);

  const signIn = await tryRestSignIn();
  if (signIn.ok) {
    console.log('User exists and password is already correct. No changes needed.');
    return;
  }
  console.log(`Sign-in: ${signIn.error || 'failed'}`);

  const signUp = await tryRestSignUp();
  if (signUp.ok) {
    console.log(`Created Firebase user: ${email}`);
    console.log(`Password: ${password}`);
    return;
  }
  console.log(`Sign-up: ${signUp.error || 'failed'}`);

  const needsPasswordReset =
    signUp.error === 'EMAIL_EXISTS' ||
    signIn.error === 'INVALID_LOGIN_CREDENTIALS' ||
    signIn.error === 'INVALID_PASSWORD';

  if (!needsPasswordReset) {
    console.error('Unable to create or update user.');
    process.exit(1);
  }

  await upsertWithAdminSdk();

  const verify = await tryRestSignIn();
  if (!verify.ok) {
    console.error('Password update failed verification:', verify.error);
    process.exit(1);
  }

  console.log('\nVerified: login works with the configured password.');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

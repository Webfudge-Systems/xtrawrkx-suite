import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isFirebaseConfigured = () =>
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.storageBucket &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId
  );

let app = null;
let auth = null;
let db = null;
let analytics = null;

try {
  if (isFirebaseConfigured()) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    if (firebaseConfig.measurementId && typeof window !== 'undefined') {
      try {
        analytics = getAnalytics(app);
      } catch {
        // Analytics optional
      }
    }
  } else {
    throw new Error('Firebase configuration is incomplete. Set NEXT_PUBLIC_FIREBASE_* in .env.local');
  }
} catch (error) {
  throw new Error(`Failed to initialize Firebase: ${error.message}`);
}

if (!db) {
  throw new Error('Firestore database is not initialized. Check your Firebase configuration.');
}

export const isFirebaseAvailable = () => Boolean(db && auth);

export { auth, db, analytics };

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (globalThis.window !== undefined && (!firebaseConfig.apiKey || !firebaseConfig.projectId)) {
  throw new Error(
    'Missing Firebase config. Copy .env.local.example to .env.local and fill in your values.'
  );
}

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

function getDb() {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({}),
    });
  } catch {
    return getFirestore(app);
  }
}

export const db = getDb();

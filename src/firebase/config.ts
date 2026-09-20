import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { db as mockDb, storage as mockStorage } from '../services/dataService';

// Detect whether real Firebase credentials are provided in environment
const hasFirebaseConfig = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'darulfaham.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'darulfaham-preview',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'darulfaham.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef',
};

let appInstance: any = null;
let firestoreInstance: any = null;
let authInstance: any = null;
let storageInstance: any = null;

if (hasFirebaseConfig) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    firestoreInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
    storageInstance = getStorage(appInstance);
    console.info('DARULFAHAM: Connected to live Firebase Firestore project:', firebaseConfig.projectId);
  } catch (error) {
    console.warn('DARULFAHAM: Firebase initialization error, falling back to secure local data engine:', error);
    firestoreInstance = mockDb;
    storageInstance = mockStorage;
    authInstance = { currentUser: null };
  }
} else {
  // Use our reactive client data engine
  firestoreInstance = mockDb;
  storageInstance = mockStorage;
  authInstance = {
    currentUser: {
      uid: 'usr-superadmin-01',
      email: 'director@darulfaham.edu.in',
      displayName: 'Dr. Tariq Rahman',
    },
  };
}

export const app = appInstance;
export const db = firestoreInstance;
export const auth = authInstance;
export const storage = storageInstance;
export const isFirebaseCloudEnabled = hasFirebaseConfig;

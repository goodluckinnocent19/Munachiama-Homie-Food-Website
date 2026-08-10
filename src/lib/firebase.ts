import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Ensure all Firebase SDK services are registered together
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  updateProfile as updateAuthProfile,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type FirebaseStorage,
} from 'firebase/storage';
import appletConfig from '../../firebase-applet-config.json';

// Load configuration from firebase-applet-config.json with Vite environment fallback
const env = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: appletConfig.apiKey || env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: appletConfig.authDomain || env.VITE_FIREBASE_AUTH_DOMAIN || 'ratta-kallan-portal.firebaseapp.com',
  projectId: appletConfig.projectId || env.VITE_FIREBASE_PROJECT_ID || 'ratta-kallan-portal',
  storageBucket: appletConfig.storageBucket || env.VITE_FIREBASE_STORAGE_BUCKET || 'ratta-kallan-portal.appspot.com',
  messagingSenderId: appletConfig.messagingSenderId || env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: appletConfig.appId || env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
  firestoreDatabaseId: appletConfig.firestoreDatabaseId || env.VITE_FIRESTORE_DATABASE_ID || '(default)',
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with persistent session (browserLocalPersistence)
export const auth = getAuth(app);
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Firebase auth persistence setup warning:', err);
  });
}

// Initialize Cloud Firestore with provisioned firestoreDatabaseId
export const db: Firestore = getFirestore(app, appletConfig.firestoreDatabaseId);

// Initialize Firebase Storage
export const storage: FirebaseStorage = getStorage(app);

// Helper function to check if live Firebase credentials have been configured
export const isFirebaseConfigured = (): boolean => {
  return (
    Boolean(firebaseConfig.apiKey) &&
    firebaseConfig.apiKey !== 'demo-api-key' &&
    Boolean(firebaseConfig.projectId) &&
    firebaseConfig.projectId !== 'ratta-kallan-portal' &&
    firebaseConfig.projectId !== 'remixed-project-id'
  );
};

// Validate connection to Firestore on boot
if (typeof window !== 'undefined' && isFirebaseConfigured()) {
  (async function testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error('Please check your Firebase configuration.');
      }
    }
  })();
}

export {
  // Auth methods
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  updateAuthProfile,
  type User,
  // Firestore methods
  collection,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  // Storage methods
  storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
};

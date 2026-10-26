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

// Safe configuration loading using Vite environment variables
const env = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'ratta-kallan-portal.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'ratta-kallan-portal',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'ratta-kallan-portal.appspot.com',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
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

// Initialize Cloud Firestore
export const db: Firestore = getFirestore(app);

// Initialize Firebase Storage
export const storage: FirebaseStorage = getStorage(app);

// Helper function to check if live Firebase credentials have been configured
export const isFirebaseConfigured = (): boolean => {
  return (
    Boolean(env.VITE_FIREBASE_API_KEY) &&
    env.VITE_FIREBASE_API_KEY !== 'demo-api-key' &&
    Boolean(env.VITE_FIREBASE_PROJECT_ID) &&
    env.VITE_FIREBASE_PROJECT_ID !== 'ratta-kallan-portal'
  );
};

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

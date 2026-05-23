// Firebase v9 Modular SDK — init + exports
import { initializeApp } from 'https://esm.sh/firebase@10.12.0/app';
import { getAuth, GoogleAuthProvider } from 'https://esm.sh/firebase@10.12.0/auth';
import { getFirestore } from 'https://esm.sh/firebase@10.12.0/firestore';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

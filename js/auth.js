// Auth — Google Sign-In + family join + email login
import { auth, googleProvider } from './firebase.js';
import {
  signInWithPopup, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from 'https://esm.sh/firebase@10.12.0/auth';

export class Auth {
  constructor(onChange) {
    this.user = null;
    this.familyId = localStorage.getItem('sgf-familyId') || null;
    onAuthStateChanged(auth, u => {
      this.user = u;
      onChange?.(u);
    });
  }

  async login() {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }

  async loginWithEmail(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  logout() {
    localStorage.removeItem('sgf-familyId');
    this.familyId = null;
    return signOut(auth);
  }

  setFamily(id) {
    this.familyId = id;
    localStorage.setItem('sgf-familyId', id);
  }
}

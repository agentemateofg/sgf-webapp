// Firestore CRUD + reactive subscriptions
import { db } from './firebase.js';
import {
  collection, doc, addDoc, getDoc, setDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp,
  writeBatch, updateDoc, deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

export class DB {
  constructor(auth) { this.auth = auth; }

  familyRef(id)   { return doc(db, 'families', id); }
  membersRef(id)  { return collection(db, 'families', id, 'members'); }
  actsRef(id)     { return collection(db, 'families', id, 'activities'); }
  wellnessRef(id) { return collection(db, 'families', id, 'wellness'); }

  // Create new family
  async createFamily(name, creator) {
    const code = this._genCode();
    const batch = writeBatch(db);
    const famDoc = this.familyRef(code);
    batch.set(famDoc, { name, createdAt: serverTimestamp(), createdBy: creator.uid });
    batch.set(doc(this.membersRef(code), creator.uid), {
      name: creator.displayName || creator.email.split('@')[0],
      photo: creator.photoURL || '',
      role: 'admin',
      joinedAt: serverTimestamp()
    });
    await batch.commit();
    return code;
  }

  // Join existing family (anyone with code can join)
  async joinFamily(code, user) {
    const snap = await getDoc(this.familyRef(code));
    if (!snap.exists()) throw new Error('Código de familia no encontrado');
    await setDoc(doc(this.membersRef(code), user.uid), {
      name: user.displayName || user.email.split('@')[0],
      photo: user.photoURL || '',
      role: 'member',
      joinedAt: serverTimestamp()
    });
    return code;
  }

  // Add activity
  async addActivity(data) {
    const fid = this.auth.familyId;
    if (!fid) throw new Error('Sin familia');
    const user = this.auth.user;
    const docData = {
      uid: user.uid,
      userName: user.displayName || user.email.split('@')[0],
      type: data.type,
      duration: data.duration || 0,
      calories: data.calories || 0,
      notes: data.notes || '',
      date: serverTimestamp(),
      createdAt: serverTimestamp()
    };
    if (data.proteins !== undefined) docData.proteins = parseInt(data.proteins, 10) || 0;
    if (data.carbs !== undefined) docData.carbs = parseInt(data.carbs, 10) || 0;
    if (data.fats !== undefined) docData.fats = parseInt(data.fats, 10) || 0;
    if (data.fiber !== undefined) docData.fiber = parseInt(data.fiber, 10) || 0;
    return addDoc(this.actsRef(fid), docData);
  }

  // Delete activity
  async deleteActivity(id) {
    const fid = this.auth.familyId;
    if (!fid) throw new Error('Sin familia');
    return deleteDoc(doc(db, 'families', fid, 'activities', id));
  }

  // Subscribe to activities (real-time)
  subscribeActivities(callback) {
    const fid = this.auth.familyId;
    if (!fid) return () => {};
    const q = query(this.actsRef(fid), orderBy('date', 'desc'));
    return onSnapshot(q, snap => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      callback(items);
    });
  }

  subscribeMembers(callback) {
    const fid = this.auth.familyId;
    if (!fid) return () => {};
    return onSnapshot(this.membersRef(fid), snap => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      callback(items);
    });
  }

  // Subscribe to daily wellness check-ins
  subscribeWellness(callback) {
    const fid = this.auth.familyId;
    if (!fid) return () => {};
    const q = query(this.wellnessRef(fid), orderBy('date', 'desc'));
    return onSnapshot(q, snap => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      callback(items);
    });
  }

  // Save/merge daily wellness check-in
  async addWellness(data) {
    const fid = this.auth.familyId;
    if (!fid) throw new Error('Sin familia');
    const user = this.auth.user;
    
    const targetUid = data.uid || user.uid;
    const targetName = data.userName || user.displayName || user.email.split('@')[0];
    
    // Deterministic ID for daily check-in per user: YYYY-MM-DD_UID
    const todayStr = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD format
    const docId = `${todayStr}_${targetUid}`;
    
    return setDoc(doc(this.wellnessRef(fid), docId), {
      uid: targetUid,
      userName: targetName,
      nivel_estres: parseInt(data.nivel_estres, 10),
      nivel_energia: parseInt(data.nivel_energia, 10),
      peso_kg: parseFloat(data.peso_kg) || null,
      date: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });
  }

  _genCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }
}

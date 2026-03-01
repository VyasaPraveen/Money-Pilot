import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { User, UserSettings } from './constants';
import { DEFAULT_USER_SETTINGS } from './constants';

export async function loginByPin(pin: string): Promise<User | null> {
  const q = query(collection(db, 'users'), where('pin', '==', pin));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return {
    id: d.id,
    name: data.name,
    pin: data.pin,
    createdAt: data.createdAt,
    settings: data.settings ?? DEFAULT_USER_SETTINGS,
  };
}

export async function registerUser(name: string, pin: string): Promise<User> {
  const existing = await loginByPin(pin);
  if (existing) throw new Error('PIN already in use. Choose a different PIN.');

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Name is required.');
  if (pin.length !== 4) throw new Error('PIN must be 4 digits.');

  const docRef = await addDoc(collection(db, 'users'), {
    name: trimmedName,
    pin,
    createdAt: Date.now(),
    settings: DEFAULT_USER_SETTINGS,
  });

  return {
    id: docRef.id,
    name: trimmedName,
    pin,
    createdAt: Date.now(),
    settings: DEFAULT_USER_SETTINGS,
  };
}

export async function updateUserSettings(
  userId: string,
  settings: UserSettings
): Promise<void> {
  await updateDoc(doc(db, 'users', userId), { settings });
}

export async function getUserById(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name,
    pin: data.pin,
    createdAt: data.createdAt,
    settings: data.settings ?? DEFAULT_USER_SETTINGS,
  };
}

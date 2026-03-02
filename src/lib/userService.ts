import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
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

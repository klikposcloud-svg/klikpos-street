import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
  type DocumentData,
} from 'firebase/firestore'
import { db } from './config'

export const firestore = {
  async create<T extends DocumentData>(collectionName: string, data: T, id?: string) {
    const docRef = id ? doc(db, collectionName, id) : doc(collection(db, collectionName))
    const docId = id || docRef.id
    await setDoc(docRef, { ...data, id: docId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    return { ...data, id: docId }
  },

  async getById<T extends DocumentData>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, collectionName, id)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return null
    return { id: docSnap.id, ...docSnap.data() } as unknown as T
  },

  async getAll<T extends DocumentData>(collectionName: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(collection(db, collectionName), ...constraints)
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as unknown as T[]
  },

  async update<T extends DocumentData>(collectionName: string, id: string, data: Partial<T>) {
    const docRef = doc(db, collectionName, id)
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() })
  },

  async delete(collectionName: string, id: string) {
    const docRef = doc(db, collectionName, id)
    await deleteDoc(docRef)
  },

  subscribe<T extends DocumentData>(collectionName: string, constraints: QueryConstraint[], callback: (data: T[]) => void) {
    const q = query(collection(db, collectionName), ...constraints)
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as unknown as T[]
      callback(data)
    })
  },

  collection,
  doc,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
}

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { auth } from './config'
import { firestore } from './firestore'
import type { UserRole } from './firestore-schema'

export const authService = {
  async register(email: string, password: string, role: UserRole, storeId: string): Promise<UserCredential> {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await firestore.create('users', {
      uid: credential.user.uid,
      email,
      role,
      storeId,
      displayName: '',
      phone: '',
      isActive: true,
      lastLogin: null,
    }, credential.user.uid)
    return credential
  },

  async login(email: string, password: string): Promise<UserCredential> {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    await firestore.update('users', credential.user.uid, {
      lastLogin: new Date().toISOString(),
    })
    return credential
  },

  async logout(): Promise<void> {
    await signOut(auth)
  },

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email)
  },

  onAuthChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback)
  },

  getCurrentUser: (): User | null => {
    return auth.currentUser
  },
}

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const STORAGE_CONFIG_KEY = 'venematic_custom_firebase_config';

/**
 * Obtiene la configuración activa de Firebase (localStorage o variables de entorno)
 */
export function getActiveFirebaseConfig(): FirebaseClientConfig {
  if (typeof window !== 'undefined') {
    try {
      const custom = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (custom) {
        const parsed = JSON.parse(custom);
        if (parsed.projectId && parsed.apiKey && parsed.apiKey !== 'mock-api-key') {
          return parsed;
        }
      }
    } catch {}
  }

  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDT26ff7t-W5WZKZktPWLZ_D79QHGh6sEg',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'klikpos-cloud.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'klikpos-cloud',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'klikpos-cloud.firebasestorage.app',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '147933668842',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:147933668842:web:cf3bd154b7164b7ce07e93',
  };
}

/**
 * Verifica si las credenciales de Firebase configuradas son válidas y no son mocks
 */
export function isFirebaseConfigured(): boolean {
  const config = getActiveFirebaseConfig();
  return (
    Boolean(config.projectId) &&
    Boolean(config.apiKey) &&
    config.apiKey !== 'mock-api-key' &&
    config.projectId !== 'venematic'
  );
}

/**
 * Permite al usuario/administrador guardar sus credenciales de Firebase Console directamente desde la interfaz
 */
export function saveCustomFirebaseConfig(config: FirebaseClientConfig) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('venematic:firebase-config-updated', { detail: config }));
}

/**
 * Restablece la configuración de Firebase
 */
export function clearCustomFirebaseConfig() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_CONFIG_KEY);
  window.dispatchEvent(new CustomEvent('venematic:firebase-config-updated', { detail: null }));
}

// Inicialización de Firebase
let app: FirebaseApp;
const config = getActiveFirebaseConfig();

if (!getApps().length) {
  app = initializeApp(config);
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage = getStorage(app);

export default app;

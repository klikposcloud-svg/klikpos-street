import { collection, doc, setDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db as firestoreDb, isFirebaseConfigured } from './config';

export interface CloudReferral {
  id: string;
  referrerCode: string;
  referrerHwid?: string;
  referrerStore?: string;
  storeName: string;
  date: string;
  status: 'paid' | 'trial';
  planPaid: string;
  earnedAmount: number;
  settlementHours: number;
  createdAt?: string;
}

class ReferralService {
  /**
   * Guarda o actualiza un referido en Firestore
   */
  async saveReferral(referral: CloudReferral): Promise<boolean> {
    if (!isFirebaseConfigured()) {
      console.warn('[ReferralService] Firebase no configurado, operando en modo local.');
      return false;
    }

    try {
      const cleanId = referral.id || `ref-${Date.now()}`;
      const refDoc = doc(firestoreDb, 'referrals', cleanId);
      
      const payload = {
        ...referral,
        id: cleanId,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(refDoc, payload, { merge: true });

      // Si tenemos el HWID o código del promotor, guardamos también en su subcolección
      if (referral.referrerCode) {
        const storeRefDoc = doc(firestoreDb, `promoters/${referral.referrerCode}/referrals`, cleanId);
        await setDoc(storeRefDoc, payload, { merge: true }).catch(() => {});
      }

      console.log(`[ReferralService] ✅ Referido ${cleanId} sincronizado en Firestore.`);
      return true;
    } catch (err) {
      console.warn('[ReferralService] Error guardando referido en Firestore:', err);
      return false;
    }
  }

  /**
   * Obtiene todos los referidos asociados a un código de referido o HWID desde Firestore
   */
  async getReferrals(referrerCode: string, hwid?: string): Promise<CloudReferral[]> {
    if (!isFirebaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return [];
    }

    try {
      const results: CloudReferral[] = [];
      const cleanCode = referrerCode.trim().toUpperCase();

      // Buscar por código de referido
      if (cleanCode) {
        const qCode = query(
          collection(firestoreDb, 'referrals'),
          where('referrerCode', '==', cleanCode),
          limit(100)
        );
        const snap = await getDocs(qCode);
        snap.forEach(docSnap => {
          results.push(docSnap.data() as CloudReferral);
        });
      }

      // Si no encontró por código y tenemos HWID, buscar por HWID
      if (results.length === 0 && hwid) {
        const qHwid = query(
          collection(firestoreDb, 'referrals'),
          where('referrerHwid', '==', hwid),
          limit(100)
        );
        const snap = await getDocs(qHwid);
        snap.forEach(docSnap => {
          results.push(docSnap.data() as CloudReferral);
        });
      }

      return results;
    } catch (err) {
      console.warn('[ReferralService] Error obteniendo referidos de Firestore:', err);
      return [];
    }
  }
}

export const referralService = new ReferralService();

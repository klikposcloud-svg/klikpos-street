import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, setDoc as setDocColl } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDT26ff7t-W5WZKZktPWLZ_D79QHGh6sEg',
  authDomain: 'klikpos-cloud.firebaseapp.com',
  projectId: 'klikpos-cloud',
  storageBucket: 'klikpos-cloud.firebasestorage.app',
  messagingSenderId: '147933668842',
  appId: '1:147933668842:web:cf3bd154b7164b7ce07e93',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirestore() {
  console.log('Testing Firestore connection to klikpos-cloud...');
  
  // 1. Guardar tasa BCV en system_config/bcv_rate
  const bcvDoc = doc(db, 'system_config', 'bcv_rate');
  await setDoc(bcvDoc, {
    rate: 871.37,
    source: 'Oficial BCV Venezuela',
    updatedAt: new Date().toISOString(),
    updatedTimestamp: Date.now()
  });
  console.log('✓ Tasa BCV 871.37 guardada en Firestore doc: system_config/bcv_rate');

  // 2. Guardar en fleet_config/tasa_oficial
  const fleetDoc = doc(db, 'fleet_config', 'tasa_oficial');
  await setDoc(fleetDoc, {
    tasa: 871.37,
    moneda: 'VES',
    timestamp: new Date().toISOString()
  });
  console.log('✓ Tasa BCV guardada en fleet_config/tasa_oficial');

  console.log('Firestore test completed successfully!');
  process.exit(0);
}

testFirestore().catch(e => {
  console.error('Error testing Firestore:', e);
  process.exit(1);
});

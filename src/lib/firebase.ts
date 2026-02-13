// Firebase Configuration and Initialization
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCBLwPBllHyp0AKT-kzDp0PnSndRcXwyPo',
  authDomain: 'agora-lineup-bfe21.firebaseapp.com',
  projectId: 'agora-lineup-bfe21',
  storageBucket: 'agora-lineup-bfe21.firebasestorage.app',
  messagingSenderId: '240984503834',
  appId: '1:240984503834:web:c2d95aa8e0800ec5c283a3',
  measurementId: 'G-ZCPBK932Y5',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators in development (optional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}

export default app;

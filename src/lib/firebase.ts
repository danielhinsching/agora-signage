import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCv6NPpzYv6ewy60lM8zCMhHq1GetEBsUM',
  authDomain: 'agora-lineup.firebaseapp.com',
  projectId: 'agora-lineup',
  storageBucket: 'agora-lineup.firebasestorage.app',
  messagingSenderId: '598307516158',
  appId: '1:598307516158:web:dca0bc7195bb7c328fffaf',
  measurementId: 'G-EXG2EQ5B1P'
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
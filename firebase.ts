
import { initializeApp as initApp } from 'firebase/app';
import { getAuth as gAuth } from 'firebase/auth';
import { getFirestore as gFirestore } from 'firebase/firestore';
import { getStorage as gStorage } from 'firebase/storage';
import * as firebaseApp from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import * as firebaseFirestore from 'firebase/firestore';
import * as firebaseStorage from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC9qyqcvuihjvDck7onH8xHRgIC4nVjFAo",
  authDomain: "deshi-wallet.firebaseapp.com",
  projectId: "deshi-wallet",
  storageBucket: "deshi-wallet.firebasestorage.app",
  messagingSenderId: "188636994156",
  appId: "1:188636994156:web:0bee38467ef9b9067e9649"
};

// Use namespaced imports with any casting to fix "no exported member" errors in the current environment
const app = (firebaseApp as any).initializeApp(firebaseConfig);
export const auth = (firebaseAuth as any).getAuth(app);
export const db = (firebaseFirestore as any).getFirestore(app);
export const storage = (firebaseStorage as any).getStorage(app);

export default app;

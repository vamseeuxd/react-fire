import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAsrS9A1bYJ3nQOuzL2r7rhuW9TeG_lTlY",
  authDomain: "expenses-app-2024.firebaseapp.com",
  projectId: "expenses-app-2024",
  storageBucket: "expenses-app-2024.firebasestorage.app",
  messagingSenderId: "343505671608",
  appId: "1:343505671608:web:a7c688f52dcc9b24562b4d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
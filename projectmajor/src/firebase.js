// Firebase config + initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 
const firebaseConfig = {
  apiKey: "AIzaSyChtk9RosDxkpK16gFcPQcSN6YuFzbIzIc",
  authDomain: "sahayk-ai-7328d.firebaseapp.com",
  projectId: "sahayk-ai-7328d",
  storageBucket: "sahayk-ai-7328d.firebasestorage.app",
  messagingSenderId: "157493706605",
  appId: "1:157493706605:web:29fc92c0c1e97f65cf2464",
  measurementId: "G-CZD7T6NVPJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // Add this export

export default app;
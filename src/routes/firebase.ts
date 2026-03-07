import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
// ADD THIS IMPORT
import { getAuth, Auth } from "firebase/auth";
const apiKey = process.env.FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: "medconnect-ai-2f5ba.firebaseapp.com",
  projectId: "medconnect-ai-2f5ba",
  storageBucket: "medconnect-ai-2f5ba.firebasestorage.app",
  messagingSenderId: "29418537398",
  appId: "1:29418537398:web:01516c254ce16786e90117"
};

const app: FirebaseApp = initializeApp(firebaseConfig);

export const db: Firestore = getFirestore(app);
// ADD THIS EXPORT
export const auth: Auth = getAuth(app);

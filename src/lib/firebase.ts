// src/lib/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// IMPORTANT: 
// 1. Create a Firebase project in the Firebase console (https://console.firebase.google.com/).
// 2. Add a Web App to your Firebase project.
// 3. Copy the Firebase config object provided during setup and paste it here.
// 4. For better security, move this configuration to environment variables (e.g., .env.local)
//    and access them via process.env.NEXT_PUBLIC_FIREBASE_API_KEY, etc.
const firebaseConfig = {
  apiKey: "AIzaSyDiSUN7xbTmnVL_MLK8s2Li90iagjLlLwg",
  authDomain: "expence-tracker-90806.firebaseapp.com",
  projectId: "expence-tracker-90806",
  storageBucket: "expence-tracker-90806.firebasestorage.app",
  messagingSenderId: "955058764423",
  appId: "1:955058764423:web:fe3d4f8837bcf9872b9622",
  measurementId: "G-M6P519HQ7L"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);

export { db, app };

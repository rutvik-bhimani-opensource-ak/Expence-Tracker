// src/lib/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: 
// 1. Create a Firebase project in the Firebase console (https://console.firebase.google.com/).
// 2. Add a Web App to your Firebase project.
// 3. Copy the Firebase config object provided during setup and paste it here.
// 4. For better security, move this configuration to environment variables (e.g., .env.local)
//    and access them via process.env.NEXT_PUBLIC_FIREBASE_API_KEY, etc.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  // measurementId: "YOUR_MEASUREMENT_ID" // Optional
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

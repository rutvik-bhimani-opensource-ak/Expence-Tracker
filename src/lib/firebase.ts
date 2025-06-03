
// src/lib/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// import { getAnalytics } from "firebase/analytics"; // Analytics can be added if needed

// IMPORTANT:
// 1. Create a Firebase project in the Firebase console (https://console.firebase.google.com/).
// 2. Add a Web App to your Firebase project.
// 3. Create a .env file in the root of your project (or .env.local).
// 4. Copy the variables from .env.example into your .env file and fill them with your actual Firebase project credentials.

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Validate that all required environment variables are set
if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId ||
  !firebaseConfig.storageBucket ||
  !firebaseConfig.messagingSenderId ||
  !firebaseConfig.appId
) {
  console.error(
    'Firebase configuration is missing. Make sure all NEXT_PUBLIC_FIREBASE_ environment variables are set in your .env file.'
  );
  // Depending on how critical Firebase is at boot, you might throw an error here
  // or allow the app to continue with a warning, understanding Firebase features might fail.
}


// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
// const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null; // Initialize analytics if needed and on client side

export { db, app };

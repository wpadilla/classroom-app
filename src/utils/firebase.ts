import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getFirestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
} from "firebase/firestore";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Legacy constants
export const docName = "classStructure";
export const docId = "bSgeILnVvFlPcf1moVp6-sean1-Nov-2023";
export const classroomsDocId = "jDF2e5crOXnGhjmmPiL9";
export const classroomCollectionName = "classrooms";

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseStoreDB = getFirestore(firebaseApp);

// Emulator configuration
const useEmulators = process.env.REACT_APP_USE_EMULATORS === "true";

if (useEmulators) {
  const emulatorHost =
    process.env.REACT_APP_EMULATOR_HOST || "localhost";
  const firestorePort = Number(
    process.env.REACT_APP_EMULATOR_FIRESTORE_PORT || 8085
  );

  connectFirestoreEmulator(firebaseStoreDB, emulatorHost, firestorePort);

  console.log(
    `Firebase Emulators conectados - Firestore: ${emulatorHost}:${firestorePort}`
  );
} else {
  // Enable offline persistence only in production (not compatible with emulators)
  enableIndexedDbPersistence(firebaseStoreDB).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("Firebase persistence failed: Multiple tabs open");
    } else if (err.code === "unimplemented") {
      console.warn("Firebase persistence not supported by browser");
    }
  });
}

// Analytics only in production (emulators don't support it)
export let analytics: ReturnType<typeof getAnalytics> | null = null;

if (!useEmulators) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(firebaseApp);
    }
  });
}

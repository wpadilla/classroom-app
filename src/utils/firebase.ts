// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA8lmedfLzmKHBRMnHkv7cfX4R8U0ZYgow",
    authDomain: "classroom-app-157de.firebaseapp.com",
    projectId: "classroom-app-157de",
    storageBucket: "classroom-app-157de.appspot.com",
    messagingSenderId: "1083645313189",
    appId: "1:1083645313189:web:9a31c7d247c7e5130acd4c",
    measurementId: "G-F68RL26VNZ"
};

export const docName = 'classStructure'
export const docId = 'bSgeILnVvFlPcf1moVp6-sean1-Nov-2023'
// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseStoreDB = getFirestore(firebaseApp);
export const analytics = getAnalytics(firebaseApp);
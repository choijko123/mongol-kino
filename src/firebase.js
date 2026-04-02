import { initializeApp } from "firebase/app";
import { getFirestore, startAfter } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCuH0nJx7f0e8KssPo8rFxc47IT50uXl_0",
  authDomain: "movie-time-92adb.firebaseapp.com",
  projectId: "movie-time-92adb",
  storageBucket: "movie-time-92adb.firebasestorage.app",
  messagingSenderId: "92887648203",
  appId: "1:92887648203:web:aeabc9773e35f810a0984e",
  measurementId: "G-FS51Q7CV9V"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

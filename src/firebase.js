import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCuH0nJx7f0e8KssPo8rFxc47IT50uXl_0",
  authDomain: "movie-time-92adb.firebaseapp.com",
  projectId: "movie-time-92adb",
  storageBucket: "movie-time-92adb.appspot.com",
  messagingSenderId: "92887648203",
  appId: "1:92887648203:web:823c50c332414460a0984e"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

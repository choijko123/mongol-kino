import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAedkLGTlj4cci0Yk13tarDR40M15xDh8U",
  authDomain: "allinone-6b949.firebaseapp.com",
  projectId: "allinone-6b949",
  storageBucket: "allinone-6b949.firebasestorage.app",
  messagingSenderId: "24228607670",
  appId: "1:24228607670:web:9b96b177b872040772d817"
};

const app = initializeApp(firebaseConfig);

export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Google popup-д Монгол locale оруулна
googleProvider.setCustomParameters({ prompt: "select_account" });

export default app;
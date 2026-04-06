import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

// Мобайл дээр redirect, desktop дээр popup ашиглана
export async function signInWithGoogle(isMobile) {
  if (isMobile) {
    await signInWithRedirect(auth, googleProvider);
    return null; // redirect буцаж ирэхэд App.js onAuthStateChanged барна
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export { getRedirectResult };
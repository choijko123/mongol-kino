import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

// Мобайл browser шалгах
function isMobileBrowser() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );
}

export async function signInWithGoogle() {
  await setPersistence(auth, browserLocalPersistence);

  if (isMobileBrowser()) {
    // Мобайл → redirect (popup блоклогддог)
    await signInWithRedirect(auth, googleProvider);
    return null;
  }

  // Desktop → popup
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export { getRedirectResult };
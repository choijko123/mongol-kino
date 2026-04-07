import { db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * Хэрэглэгчийн мэдээллийг Firestore-д хадгалах / шинэчлэх
 * Анхны нэвтрэлтэд автоматаар дуудагдана
 */
export async function upsertUser(firebaseUser) {
  if (!firebaseUser) return;
  const ref  = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // Анхны бүртгэл — role: "user" default
    await setDoc(ref, {
      uid:         firebaseUser.uid,
      email:       firebaseUser.email,
      displayName: firebaseUser.displayName || "",
      photoURL:    firebaseUser.photoURL    || "",
      role:        "user",          // "user" | "admin" | "moderator"
      createdAt:   serverTimestamp(),
      lastLogin:   serverTimestamp(),
    });
  } else {
    // Буцаж нэвтэрсэн — lastLogin шинэчлэнэ, role хэвээр үлдэнэ
    await setDoc(ref, {
      displayName: firebaseUser.displayName || snap.data().displayName,
      photoURL:    firebaseUser.photoURL    || snap.data().photoURL,
      lastLogin:   serverTimestamp(),
    }, { merge: true });
  }
}

/**
 * Хэрэглэгчийн role авах
 * @returns "admin" | "moderator" | "user" | null
 */
export async function getUserRole(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data().role || "user") : "user";
  } catch { return "user"; }
}

/**
 * Хэрэглэгч admin эсэхийг шалгах
 */
export async function isUserAdmin(uid) {
  const role = await getUserRole(uid);
  return role === "admin";
}
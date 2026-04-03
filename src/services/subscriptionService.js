import { db } from "../firebase";
import {
  doc, getDoc, setDoc, updateDoc,
  collection, getDocs, serverTimestamp,
} from "firebase/firestore";
import { BANK_INFO } from "../config/constants";

// Хэрэглэгчийн subscription статус авах
export async function fetchSubStatus(uid) {
  const snap = await getDoc(doc(db, "subscriptions", uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  if (d.status === "active") {
    const expiry = d.expiresAt?.toDate?.() || new Date(d.expiresAt);
    return expiry > new Date() ? "active" : "expired";
  }
  return d.status; // "pending" | "rejected"
}

// Subscription хүсэлт илгээх
export async function requestSubscription(user, note) {
  await setDoc(doc(db, "subscriptions", user.uid), {
    uid: user.uid,
    email: user.email,
    name: user.displayName || "",
    status: "pending",
    note: note.trim(),
    requestedAt: serverTimestamp(),
  });
}

// Бүх subscription хүсэлтүүд авах (Админ)
export async function fetchAllSubscriptions() {
  const snap = await getDocs(collection(db, "subscriptions"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Subscription батлах (Админ)
export async function approveSubscription(uid) {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + BANK_INFO.days);
  await updateDoc(doc(db, "subscriptions", uid), {
    status: "active",
    approvedAt: serverTimestamp(),
    expiresAt: expiry,
  });
  return expiry;
}

// Subscription татгалзах (Админ)
export async function rejectSubscription(uid) {
  await updateDoc(doc(db, "subscriptions", uid), { status: "rejected" });
}

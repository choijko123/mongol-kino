import { db } from "../firebase";
import {
  doc, getDoc, setDoc, updateDoc,
  arrayUnion, arrayRemove,
} from "firebase/firestore";

// Кинонд like дарах / авах
export async function toggleLike(user, movieId, isLiked) {
  const likesRef = doc(db, "likes", movieId);
  const snap = await getDoc(likesRef);
  if (!snap.exists()) {
    await setDoc(likesRef, { users: isLiked ? [] : [user.uid] });
  } else {
    await updateDoc(likesRef, {
      users: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  }
  const userRef = doc(db, "userLikes", user.uid);
  const usnap = await getDoc(userRef);
  if (!usnap.exists()) {
    await setDoc(userRef, { movies: isLiked ? [] : [movieId] });
  } else {
    await updateDoc(userRef, {
      movies: isLiked ? arrayRemove(movieId) : arrayUnion(movieId),
    });
  }
}

// Бүх киноны like тоог авах
export async function fetchLikeCounts(movies) {
  const counts = {};
  await Promise.all(
    movies.map(async (m) => {
      try {
        const snap = await getDoc(doc(db, "likes", m.id));
        counts[m.id] = snap.exists() ? (snap.data().users || []).length : 0;
      } catch {
        counts[m.id] = 0;
      }
    })
  );
  return counts;
}

// Тухайн хэрэглэгчийн like-дсан кинонуудын ID авах
export async function fetchUserLikedIds(uid) {
  try {
    const snap = await getDoc(doc(db, "userLikes", uid));
    return snap.exists() ? snap.data().movies || [] : [];
  } catch {
    return [];
  }
}

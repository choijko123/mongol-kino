// ─── КиноТайм — үндсэн routing файл ─────────────────────────────
import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import "./config/constants";            // fonts inject
import { ADMIN_EMAIL } from "./config/constants";
import { css } from "./styles/animations";
import { Splash } from "./components/Splash";
import { Nav } from "./components/Nav";
import { Toast } from "./components/Toast";
import { Home } from "./pages/Home";
import { Watch } from "./pages/Watch";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Admin } from "./pages/Admin";
import { Subscribe } from "./pages/Subscribe";
import { SubGate } from "./pages/SubGate";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState("home");
  const [watchMovie, setWatchMovie] = useState(null);
  const [toast, setToast] = useState(null);
  const [subStatus, setSubStatus] = useState(null);

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  // Subscription статус
  useEffect(() => {
    if (!user) { setSubStatus(null); return; }
    getDoc(doc(db, "subscriptions", user.uid)).then((snap) => {
      if (!snap.exists()) { setSubStatus(null); return; }
      const d = snap.data();
      if (d.status === "active") {
        const expiry = d.expiresAt?.toDate?.() || new Date(d.expiresAt);
        setSubStatus(expiry > new Date() ? "active" : "expired");
      } else {
        setSubStatus(d.status);
      }
    }).catch(() => setSubStatus(null));
  }, [user]);

  // Movies fetch
  useEffect(() => {
    import("firebase/firestore").then(({ collection, getDocs, query, orderBy }) => {
      const q = query(collection(db, "movies"), orderBy("createdAt", "desc"));
      getDocs(q).then((snap) => {
        setMovies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }).catch(() => setMovies([]));
    });
  }, []);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function openWatch(movie) {
    setWatchMovie(movie);
    setPage("watch");
  }

  const isAdmin = user?.email === ADMIN_EMAIL;

  if (loading) return <Splash />;

  return (
    <div style={{ minHeight:"100vh", background:"#08091a", color:"#e0e8ff", fontFamily:"'Rajdhani',sans-serif" }}>
      <style>{css}</style>
      <Nav user={user} isAdmin={isAdmin} page={page} setPage={setPage} subStatus={subStatus} />
      {toast && <Toast {...toast} />}

      {page === "home" && (
        <Home movies={movies} user={user} setPage={setPage} openWatch={openWatch} subStatus={subStatus} />
      )}
      {page === "login" && <Login setPage={setPage} showToast={showToast} />}
      {page === "register" && <Register setPage={setPage} showToast={showToast} />}
      {page === "subscribe" && (
        <Subscribe user={user} setPage={setPage} subStatus={subStatus} showToast={showToast} />
      )}
      {page === "admin" && isAdmin && (
        <Admin movies={movies} fetchMovies={() => {
          import("firebase/firestore").then(({ collection, getDocs, query, orderBy }) => {
            const q = query(collection(db, "movies"), orderBy("createdAt", "desc"));
            getDocs(q).then(snap => setMovies(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
          });
        }} showToast={showToast} />
      )}
      {page === "watch" && (
        watchMovie
          ? (subStatus === "active" || isAdmin
              ? <Watch movie={watchMovie} setPage={setPage} />
              : <SubGate setPage={setPage} subStatus={subStatus} />)
          : null
      )}
    </div>
  );
}
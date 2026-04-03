import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
  updateDoc,
} from "firebase/firestore";

// ─── CLOUDINARY ТОХИРГОО ───────────────────────────────────────────
// cloudinary.com дээр бүртгүүлж дараах утгуудыг оруулна:
const CLOUDINARY_CLOUD_NAME = "dfoisc49h";   // жишээ: "dxyz123abc"
const CLOUDINARY_UPLOAD_PRESET = "padzzmf3"; // unsigned preset нэр
// ──────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = "admin@movie.mn";

// ─── ДАНСНЫ МЭДЭЭЛЭЛ ────────────────────────────────────────────────
const BANK_INFO = {
  bank: "Хаан Банк",           // ← өөрийн банкаа оруулна
  account: "5586016813",        // ← өөрийн дансны дугаараа оруулна
  name: "s.enkhtur",            // ← өөрийн нэрээ оруулна
  price: "9,900",               // ← subscription үнэ
  currency: "₮",
  days: 30,                     // ← хэдэн хоног
};
// ────────────────────────────────────────────────────────────────────

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap";
document.head.appendChild(fontLink);

// Cloudinary upload функц
async function uploadToCloudinary(file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const resourceType = file.type.startsWith("video") ? "video" : "image";
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      const res = JSON.parse(xhr.responseText);
      if (xhr.status === 200) resolve(res.secure_url);
      else reject(new Error(res.error?.message || "Upload амжилтгүй боллоо"));
    };
    xhr.onerror = () => reject(new Error("Сүлжээний алдаа гарлаа"));
    xhr.send(formData);
  });
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState("home");
  const [watchMovie, setWatchMovie] = useState(null);
  const [toast, setToast] = useState(null);
  const [subStatus, setSubStatus] = useState(null); // null | "pending" | "active"

  // Fetch subscription status
  useEffect(() => {
    if (!user) { setSubStatus(null); return; }
    getDoc(doc(db, "subscriptions", user.uid)).then(snap => {
      if (!snap.exists()) { setSubStatus(null); return; }
      const d = snap.data();
      if (d.status === "active") {
        // Check expiry
        const expiry = d.expiresAt?.toDate?.() || new Date(d.expiresAt);
        setSubStatus(expiry > new Date() ? "active" : "expired");
      } else {
        setSubStatus(d.status); // "pending"
      }
    }).catch(() => setSubStatus(null));
  }, [user]);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, []);

  useEffect(() => { fetchMovies(); }, []);

  async function fetchMovies() {
    try {
      const q = query(collection(db, "movies"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setMovies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch { setMovies([]); }
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function openWatch(movie) {
    setWatchMovie(movie);
    setPage("watch");
  }

  if (loading) return <Splash />;
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div style={s.root}>
      <style>{css}</style>
      <Nav user={user} isAdmin={isAdmin} page={page} setPage={setPage} />
      {toast && <Toast {...toast} />}
      {page === "home" && <Home movies={movies} user={user} setPage={setPage} openWatch={openWatch} subStatus={subStatus} />}
      {page === "login" && <Login setPage={setPage} showToast={showToast} />}
      {page === "register" && <Register setPage={setPage} showToast={showToast} />}
      {page === "subscribe" && <Subscribe user={user} setPage={setPage} subStatus={subStatus} showToast={showToast} />}
      {page === "admin" && isAdmin && <Admin movies={movies} fetchMovies={fetchMovies} showToast={showToast} />}
      {page === "watch" && (watchMovie
        ? (subStatus === "active" || isAdmin
            ? <Watch movie={watchMovie} setPage={setPage} />
            : <SubGate setPage={setPage} subStatus={subStatus} />)
        : null)}
    </div>
  );
}

function Splash() {
  return <div style={s.splash}><div style={s.splashLogo}>КИНО<span style={{color:"#FF3B3B"}}>ТАЙМ</span></div></div>;
}

function Nav({ user, isAdmin, page, setPage }) {
  return (
    <nav style={s.nav}>
      <div style={s.navLogo} onClick={() => setPage("home")}>КИНО<span style={{color:"#FF3B3B"}}>ТАЙМ</span></div>
      <div style={s.navLinks}>
        {user ? (
          <>
            {isAdmin && <button style={page==="admin"?s.navBtnActive:s.navBtn} onClick={()=>setPage("admin")}>Админ</button>}
            <ProfileMenu user={user} setPage={setPage} isAdmin={isAdmin} />
          </>
        ) : (
          <>
            <button style={page==="login"?s.navBtnActive:s.navBtn} onClick={()=>setPage("login")}>Нэвтрэх</button>
            <button style={s.navBtnRed} onClick={()=>setPage("register")}>Бүртгүүлэх</button>
          </>
        )}
      </div>
    </nav>
  );
}

function ProfileMenu({ user, setPage }) {
  const [open, setOpen] = useState(false);
  const menuRef = React.useRef(null);

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function logout() {
    await signOut(auth);
    setOpen(false);
    setPage("home");
  }

  const name = user.displayName || user.email.split("@")[0];
  const initials = name.slice(0,2).toUpperCase();
  const uid = user.uid;
  const email = user.email;
  const joinedRaw = user.metadata?.creationTime;
  const joined = joinedRaw ? new Date(joinedRaw).toLocaleDateString("mn-MN", {year:"numeric",month:"long",day:"numeric"}) : "—";
  const colors = ["#FF3B3B","#FF6B35","#E91E8C","#3B82F6","#10B981","#8B5CF6"];
  const avatarColor = colors[uid.charCodeAt(0) % colors.length];

  return (
    <div ref={menuRef} style={{position:"relative"}}>
      {/* Avatar trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          width:38, height:38, borderRadius:"50%",
          background: user.photoURL ? "transparent" : avatarColor,
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", fontWeight:700, fontSize:14, color:"#fff",
          border: open ? "2px solid #FF3B3B" : "2px solid #2a2a2a",
          transition:"border-color 0.2s", overflow:"hidden", flexShrink:0,
        }}
      >
        {user.photoURL
          ? <img src={user.photoURL} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
          : initials
        }
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 12px)", right:0,
          width:300, background:"#111", border:"1px solid #222",
          borderRadius:16, overflow:"hidden", zIndex:200,
          boxShadow:"0 24px 64px rgba(0,0,0,0.8)",
        }}>
          <style>{`@keyframes pm-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div style={{animation:"pm-in 0.18s ease"}}>

            {/* Header */}
            <div style={{background:"#161616", padding:"20px", borderBottom:"1px solid #1e1e1e"}}>
              <div style={{display:"flex", gap:14, alignItems:"center", marginBottom:14}}>
                <div style={{
                  width:58, height:58, borderRadius:"50%", flexShrink:0,
                  background: user.photoURL ? "transparent" : avatarColor,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:700, fontSize:22, color:"#fff", overflow:"hidden",
                  border:"2px solid #2a2a2a",
                }}>
                  {user.photoURL
                    ? <img src={user.photoURL} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    : initials
                  }
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:700, fontSize:16, color:"#fff", marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{name}</div>
                  <div style={{
                    display:"inline-block", fontSize:11, fontWeight:700, letterSpacing:1,
                    background: email === ADMIN_EMAIL ? "rgba(255,59,59,0.15)" : "rgba(255,255,255,0.07)",
                    color: email === ADMIN_EMAIL ? "#FF3B3B" : "#888",
                    padding:"2px 8px", borderRadius:4, textTransform:"uppercase",
                  }}>
                    {email === ADMIN_EMAIL ? "Админ" : "Хэрэглэгч"}
                  </div>
                </div>
              </div>

              {/* UID badge */}
              <div style={{
                background:"#0d0d0d", border:"1px solid #1e1e1e",
                borderRadius:8, padding:"10px 12px",
                display:"flex", alignItems:"center", gap:10,
              }}>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:10, color:"#444", letterSpacing:1.5, textTransform:"uppercase", marginBottom:4}}>Хэрэглэгчийн ID</div>
                  <div style={{fontSize:11, color:"#666", fontFamily:"monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{uid}</div>
                </div>
                <button
                  onClick={() => { navigator.clipboard?.writeText(uid); }}
                  style={{
                    background:"#1a1a1a", border:"1px solid #2a2a2a",
                    color:"#888", padding:"5px 10px", borderRadius:6,
                    cursor:"pointer", fontSize:11, whiteSpace:"nowrap",
                    fontFamily:"'DM Sans',sans-serif", flexShrink:0,
                  }}
                >Хуулах</button>
              </div>
            </div>

            {/* Info rows */}
            <div style={{padding:"8px 0"}}>
              {[
                { icon:"✉️", label:"Имэйл", value: email },
                { icon:"📅", label:"Бүртгүүлсэн огноо", value: joined },
                { icon:"🎬", label:"Үзсэн кино", value: "—" },
              ].map(({icon,label,value}) => (
                <div key={label} style={{display:"flex", alignItems:"center", gap:12, padding:"10px 20px"}}>
                  <span style={{fontSize:15, width:22, textAlign:"center", flexShrink:0}}>{icon}</span>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:11, color:"#555", marginBottom:2}}>{label}</div>
                    <div style={{fontSize:13, color:"#ccc", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{borderTop:"1px solid #1e1e1e", padding:"8px 8px 10px"}}>
              <button
                onClick={() => { setOpen(false); setPage("subscribe"); }}
                style={{
                  width:"100%", background:"transparent", border:"none",
                  color:"#FF3B3B", padding:"10px 14px", borderRadius:8,
                  cursor:"pointer", textAlign:"left", fontSize:14,
                  display:"flex", alignItems:"center", gap:10,
                  fontFamily:"'DM Sans',sans-serif",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M1 7h14"/></svg>
                Subscription авах
              </button>
              <button
                onClick={logout}
                style={{
                  width:"100%", background:"transparent", border:"none",
                  color:"#e74c3c", padding:"10px 14px", borderRadius:8,
                  cursor:"pointer", textAlign:"left", fontSize:14,
                  display:"flex", alignItems:"center", gap:10,
                  fontFamily:"'DM Sans',sans-serif",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 2H2v12h4M10 5l3 3-3 3M13 8H6"/></svg>
                Системээс гарах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Home({ movies, user, setPage, openWatch, subStatus }) {
  const [tab, setTab] = useState("home");
  const [search, setSearch] = useState("");
  const [likedIds, setLikedIds] = useState([]);
  const [likeCounts, setLikeCounts] = useState({});

  // Fetch like counts for all movies
  useEffect(() => {
    async function fetchLikes() {
      const counts = {};
      await Promise.all(movies.map(async (m) => {
        try {
          const snap = await getDoc(doc(db, "likes", m.id));
          counts[m.id] = snap.exists() ? (snap.data().users || []).length : 0;
        } catch { counts[m.id] = 0; }
      }));
      setLikeCounts(counts);
    }
    if (movies.length) fetchLikes();
  }, [movies]);

  // Fetch user's liked movies
  useEffect(() => {
    async function fetchUserLikes() {
      if (!user) { setLikedIds([]); return; }
      try {
        const snap = await getDoc(doc(db, "userLikes", user.uid));
        setLikedIds(snap.exists() ? (snap.data().movies || []) : []);
      } catch { setLikedIds([]); }
    }
    fetchUserLikes();
  }, [user]);

  async function toggleLike(e, movieId) {
    e.stopPropagation();
    if (!user) { setPage("login"); return; }
    const liked = likedIds.includes(movieId);
    // Optimistic UI
    setLikedIds(prev => liked ? prev.filter(id=>id!==movieId) : [...prev, movieId]);
    setLikeCounts(prev => ({...prev, [movieId]: (prev[movieId]||0) + (liked ? -1 : 1)}));
    try {
      const likesRef = doc(db, "likes", movieId);
      const likesSnap = await getDoc(likesRef);
      if (!likesSnap.exists()) {
        await setDoc(likesRef, { users: liked ? [] : [user.uid] });
      } else {
        await updateDoc(likesRef, { users: liked ? arrayRemove(user.uid) : arrayUnion(user.uid) });
      }
      const userLikesRef = doc(db, "userLikes", user.uid);
      const userLikesSnap = await getDoc(userLikesRef);
      if (!userLikesSnap.exists()) {
        await setDoc(userLikesRef, { movies: liked ? [] : [movieId] });
      } else {
        await updateDoc(userLikesRef, { movies: liked ? arrayRemove(movieId) : arrayUnion(movieId) });
      }
    } catch (err) {
      console.error("Like алдаа:", err.code, err.message);
      // Revert on error
      setLikedIds(prev => liked ? [...prev, movieId] : prev.filter(id=>id!==movieId));
      setLikeCounts(prev => ({...prev, [movieId]: (prev[movieId]||0) + (liked ? 1 : -1)}));
    }
  }

  const TABS = [
    { id:"home", label:"Нүүр" },
    { id:"featured", label:"Онцлох кино" },
    { id:"liked", label:"Таалагдсан" },
  ];

  const filtered = movies.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));
  const featuredMovies = movies.filter((_, i) => i < 6);
  const likedMovies = movies.filter(m => likedIds.includes(m.id));
  const hero = movies[0];

  return (
    <div style={s.page}>
      {/* Hero — зөвхөн Нүүр tab-д */}
      {tab === "home" && hero && (
        <div style={{...s.hero, backgroundImage:`url(${hero.poster})`}}>
          <div style={s.heroOverlay}>
            <div style={s.heroTag}>Шинэ кино</div>
            <h1 style={s.heroTitle}>{hero.title}</h1>
            <p style={s.heroDesc}>{hero.description}</p>
            <div style={{display:"flex", gap:12, alignItems:"center"}}>
              <button style={s.heroBtn} onClick={() => {
                if(!user){ setPage("login"); return; }
                if(subStatus !== "active"){ setPage("subscribe"); return; }
                openWatch(hero);
              }}>▶ &nbsp;Үзэх</button>
              <button
                onClick={(e) => toggleLike(e, hero.id)}
                style={{
                  background: likedIds.includes(hero.id) ? "rgba(255,59,59,0.3)" : "rgba(255,255,255,0.1)",
                  border: "1.5px solid " + (likedIds.includes(hero.id) ? "#FF3B3B" : "rgba(255,255,255,0.3)"),
                  color: likedIds.includes(hero.id) ? "#FF3B3B" : "#fff",
                  padding:"13px 20px", borderRadius:8, cursor:"pointer",
                  fontSize:18, display:"flex", alignItems:"center", gap:8,
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                  transition:"all 0.2s",
                }}
              >
                {likedIds.includes(hero.id) ? "♥" : "♡"}
                <span style={{fontSize:14}}>{likeCounts[hero.id] || 0}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {tab === "home" && movies.length === 0 && (
        <div style={s.emptyHero}>
          <div style={s.splashLogo}>КИНО<span style={{color:"#FF3B3B"}}>ТАЙМ</span></div>
          <p style={{color:"#555",marginTop:16}}>Удахгүй кинонууд нэмэгдэнэ...</p>
        </div>
      )}

      {/* Tab bar */}
      <div style={s.tabBar}>
        <div style={s.tabInner}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearch(""); }}
              style={{
                ...s.tabBtn,
                color: tab === t.id ? "#fff" : "#666",
                borderBottom: tab === t.id ? "2px solid #FF3B3B" : "2px solid transparent",
              }}
            >
              {t.label}
              {t.id === "liked" && likedIds.length > 0 && (
                <span style={{marginLeft:6, background:"#FF3B3B", color:"#fff", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:10}}>
                  {likedIds.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search — home tab-д л харагдана */}
        {tab === "home" && (
          <input style={s.tabSearch} placeholder="🔍 Хайх..." value={search} onChange={(e)=>setSearch(e.target.value)} />
        )}
      </div>

      {/* Content */}
      <div style={s.gridWrap}>
        {tab === "home" && (
          <>
            <h2 style={s.sectionTitle}>Бүх кино</h2>
            {filtered.length === 0 && <p style={{color:"#555",textAlign:"center",marginTop:40}}>Кино олдсонгүй</p>}
            <div style={s.grid}>
              {filtered.map((m) => (
                <MovieCard key={m.id} movie={m} user={user} setPage={setPage} openWatch={openWatch}
                  liked={likedIds.includes(m.id)} likeCount={likeCounts[m.id]||0} onLike={toggleLike} />
              ))}
            </div>
          </>
        )}

        {tab === "featured" && (
          <>
            <h2 style={s.sectionTitle}>Онцлох кино</h2>
            <div style={s.grid}>
              {featuredMovies.map((m) => (
                <MovieCard key={m.id} movie={m} user={user} setPage={setPage} openWatch={openWatch}
                  liked={likedIds.includes(m.id)} likeCount={likeCounts[m.id]||0} onLike={toggleLike} featured />
              ))}
            </div>
          </>
        )}

        {tab === "liked" && (
          <>
            <h2 style={s.sectionTitle}>Таалагдсан кино</h2>
            {!user && <p style={{color:"#555",textAlign:"center",marginTop:40}}>Нэвтэрч орсны дараа харагдана</p>}
            {user && likedMovies.length === 0 && (
              <div style={{textAlign:"center", marginTop:60, color:"#555"}}>
                <div style={{fontSize:48, marginBottom:16}}>♡</div>
                <div style={{fontSize:15}}>Таалагдсан кино байхгүй байна</div>
                <div style={{fontSize:13, marginTop:6, color:"#444"}}>Кино карт дээрх ♡ товч дарж нэмнэ</div>
              </div>
            )}
            <div style={s.grid}>
              {likedMovies.map((m) => (
                <MovieCard key={m.id} movie={m} user={user} setPage={setPage} openWatch={openWatch}
                  liked={true} likeCount={likeCounts[m.id]||0} onLike={toggleLike} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MovieCard({ movie, user, setPage, openWatch, liked, likeCount, onLike, featured }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        ...s.card,
        transform: hovered ? "scale(1.04)" : "scale(1)",
        boxShadow: hovered ? "0 8px 32px rgba(255,59,59,0.2)" : "0 4px 20px rgba(0,0,0,0.4)",
        outline: featured ? "1.5px solid #FF3B3B" : "none",
      }}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      onClick={()=>{
        if(!user){ setPage("login"); return; }
        openWatch(movie);
      }}
    >
      <div style={{position:"relative"}}>
        {movie.poster
          ? <img src={movie.poster} alt={movie.title} style={s.cardImg} />
          : <div style={s.cardNoImg}>🎬</div>
        }
        {/* Featured badge */}
        {featured && (
          <div style={{position:"absolute", top:8, left:8, background:"#FF3B3B", color:"#fff",
            fontSize:9, fontWeight:700, letterSpacing:1.5, padding:"3px 8px", borderRadius:4, textTransform:"uppercase"}}>
            Онцлох
          </div>
        )}
        {/* Like button */}
        <button
          onClick={(e) => onLike(e, movie.id)}
          style={{
            position:"absolute", top:8, right:8,
            background: liked ? "rgba(255,59,59,0.85)" : "rgba(0,0,0,0.55)",
            border: "none", borderRadius:"50%",
            width:34, height:34, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color: liked ? "#fff" : "#ccc",
            transition:"all 0.2s", backdropFilter:"blur(4px)",
          }}
        >
          {liked ? "♥" : "♡"}
        </button>
      </div>
      <div style={s.cardBody}>
        <div style={s.cardTitle}>{movie.title}</div>
        <div style={s.cardDesc}>{movie.description}</div>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8}}>
          <div style={s.cardPlay}>▶ Үзэх</div>
          {likeCount > 0 && (
            <div style={{fontSize:12, color: liked ? "#FF3B3B" : "#555", display:"flex", alignItems:"center", gap:3}}>
              ♥ <span>{likeCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Watch({ movie, setPage }) {
  const vidRef = React.useRef(null);
  const shellRef = React.useRef(null);
  const fillRef = React.useRef(null);
  const buffRef = React.useRef(null);
  const overlayRef = React.useRef(null);
  const centerRef = React.useRef(null);
  const spinnerRef = React.useRef(null);
  const timeRef = React.useRef(null);
  const playIconRef = React.useRef(null);
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [vol, setVol] = React.useState(1);
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const hideTimer = React.useRef(null);

  function fmt(s) {
    s = Math.floor(s || 0);
    const m = Math.floor(s / 60), sec = s % 60;
    return m + ':' + String(sec).padStart(2,'0');
  }
  function togglePlay() {
    const v = vidRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  }
  function skip(s) {
    const v = vidRef.current; if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration||0, v.currentTime + s));
  }
  function handleVolChange(val) {
    const v = vidRef.current; if (!v) return;
    v.volume = val; v.muted = val == 0;
    setVol(val); setMuted(val == 0);
  }
  function toggleMute() {
    const v = vidRef.current; if (!v) return;
    v.muted = !v.muted; setMuted(v.muted);
  }
  function cycleSpeed() {
    const v = vidRef.current; if (!v) return;
    const idx = (speeds.indexOf(speed) + 1) % speeds.length;
    const ns = speeds[idx]; v.playbackRate = ns; setSpeed(ns);
  }
  function toggleFS() {
    if (!document.fullscreenElement) shellRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }
  function showOverlay() {
    overlayRef.current?.classList.remove('kt-hidden');
    clearTimeout(hideTimer.current);
    if (playing) hideTimer.current = setTimeout(() => overlayRef.current?.classList.add('kt-hidden'), 2500);
  }

  React.useEffect(() => {
    const v = vidRef.current; if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      if (!v.duration) return;
      if (fillRef.current) fillRef.current.style.width = (v.currentTime / v.duration * 100) + '%';
      if (timeRef.current) timeRef.current.textContent = fmt(v.currentTime) + ' / ' + fmt(v.duration);
    };
    const onProgress = () => {
      if (v.buffered.length && v.duration && buffRef.current)
        buffRef.current.style.width = (v.buffered.end(v.buffered.length-1) / v.duration * 100) + '%';
    };
    const onWaiting = () => { if (spinnerRef.current) spinnerRef.current.style.display='block'; };
    const onPlaying = () => { if (spinnerRef.current) spinnerRef.current.style.display='none'; };
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('progress', onProgress);
    v.addEventListener('waiting', onWaiting);
    v.addEventListener('playing', onPlaying);
    const onKey = (e) => {
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowRight') skip(10);
      if (e.key === 'ArrowLeft') skip(-10);
      if (e.key === 'f') toggleFS();
      if (e.key === 'm') toggleMute();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      v.removeEventListener('play', onPlay); v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTimeUpdate); v.removeEventListener('progress', onProgress);
      v.removeEventListener('waiting', onWaiting); v.removeEventListener('playing', onPlaying);
      document.removeEventListener('keydown', onKey);
    };
  }, [playing]);

  const psBase = {
    position:'relative', background:'#000', margin:'16px 32px 0',
    borderRadius:16, overflow:'hidden', aspectRatio:'16/9', cursor:'pointer',
  };

  return (
    <div style={{maxWidth:960, margin:'0 auto', background:'#0a0a0a', minHeight:'100vh'}}>
      <style>{playerCSS}</style>
      <button style={s.backBtn} onClick={()=>setPage("home")}>← Буцах</button>

      <div style={{padding:'0 32px 12px'}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:2,color:'#FF3B3B',textTransform:'uppercase',marginBottom:8}}>
          {movie.genre || 'Кино'}
        </div>
        <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,letterSpacing:1,margin:'0 0 8px',color:'#fff'}}>{movie.title}</h2>
        <p style={{fontSize:14,color:'#888',lineHeight:1.6,margin:0}}>{movie.description}</p>
      </div>

      {/* Player shell */}
      <div ref={shellRef} style={psBase}
        onMouseMove={showOverlay}
        onMouseLeave={() => { if (playing) overlayRef.current?.classList.add('kt-hidden'); }}
        onClick={togglePlay}>

        <video ref={vidRef} src={movie.videoUrl} style={{width:'100%',height:'100%',display:'block',objectFit:'contain'}} />

        {/* Spinner */}
        <div ref={spinnerRef} className="kt-spinner" />

        {/* Overlay */}
        <div ref={overlayRef} className="kt-overlay" onClick={e => e.stopPropagation()}>

          {/* Big center play/pause */}
          <div className="kt-center-btn" onClick={togglePlay}>
            {playing
              ? <svg width="26" height="26" viewBox="0 0 26 26" fill="white"><rect x="4" y="3" width="5" height="20" rx="1"/><rect x="17" y="3" width="5" height="20" rx="1"/></svg>
              : <svg width="26" height="26" viewBox="0 0 26 26" fill="white"><polygon points="7,3 23,13 7,23"/></svg>
            }
          </div>

          {/* Bottom controls */}
          <div className="kt-controls">
            {/* Progress */}
            <div className="kt-prog" onClick={e => {
              const r = e.currentTarget.getBoundingClientRect();
              if (vidRef.current) vidRef.current.currentTime = ((e.clientX - r.left) / r.width) * (vidRef.current.duration || 0);
            }}>
              <div ref={buffRef} className="kt-prog-buf" style={{width:'0%'}} />
              <div ref={fillRef} className="kt-prog-fill" style={{width:'0%'}} />
            </div>

            {/* Button row */}
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              {/* Play */}
              <button className="kt-btn" onClick={togglePlay}>
                {playing
                  ? <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><rect x="3" y="2" width="4" height="14" rx="0.5"/><rect x="11" y="2" width="4" height="14" rx="0.5"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><polygon points="4,2 16,9 4,16"/></svg>
                }
              </button>
              {/* Skip back */}
              <button className="kt-btn" onClick={()=>skip(-10)}>
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6"/><path d="M8 2L5.5 4.5 8 7"/>
                  <text x="5" y="10.5" fontSize="4.5" fill="currentColor" stroke="none" fontFamily="sans-serif">10</text>
                </svg>
              </button>
              {/* Skip fwd */}
              <button className="kt-btn" onClick={()=>skip(10)}>
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M9 2c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6"/><path d="M9 2l2.5 2.5L9 7"/>
                  <text x="5" y="10.5" fontSize="4.5" fill="currentColor" stroke="none" fontFamily="sans-serif">10</text>
                </svg>
              </button>
              {/* Time */}
              <span ref={timeRef} style={{fontSize:13,color:'#aaa',fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap'}}>0:00 / 0:00</span>

              <div style={{flex:1}} />

              {/* Volume */}
              <button className="kt-btn" onClick={toggleMute}>
                {muted || vol==0
                  ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><polygon points="3,6 7,6 12,2 12,16 7,12 3,12"/><line x1="15" y1="6" x2="15" y2="12"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><polygon points="3,6 7,6 12,2 12,16 7,12 3,12"/><path d="M14 6c1 1 1 5 0 6"/><path d="M15.5 4c2 2 2 8 0 10"/></svg>
                }
              </button>
              <input type="range" min="0" max="1" step="0.01" value={muted?0:vol}
                onChange={e=>handleVolChange(parseFloat(e.target.value))}
                style={{width:70,height:3,accentColor:'#FF3B3B',cursor:'pointer'}} />

              {/* Speed */}
              <button className="kt-speed" onClick={cycleSpeed}>{speed}×</button>

              {/* Fullscreen */}
              <button className="kt-btn" onClick={toggleFS}>
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M2 5V2h3M12 2h3v3M15 12v3h-3M5 15H2v-3"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Login({ setPage, showToast }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  async function submit(e) {
    e.preventDefault(); setErr("");
    try { await signInWithEmailAndPassword(auth, email, pw); showToast("Амжилттай нэвтэрлээ!"); setPage("home"); }
    catch { setErr("Имэйл эсвэл нууц үг буруу байна."); }
  }
  return (
    <div style={s.authWrap}>
      <div style={s.authBox}>
        <div style={s.authLogo}>КИНО<span style={{color:"#FF3B3B"}}>ТАЙМ</span></div>
        <h2 style={s.authTitle}>Нэвтрэх</h2>
        <form onSubmit={submit} style={s.form}>
          <label style={s.label}>Имэйл</label>
          <input style={s.input} type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="ta@example.com" required />
          <label style={s.label}>Нууц үг</label>
          <input style={s.input} type="password" value={pw} onChange={(e)=>setPw(e.target.value)} placeholder="••••••••" required />
          {err && <div style={s.errMsg}>{err}</div>}
          <button type="submit" style={s.btnRed}>Нэвтрэх</button>
        </form>
        <p style={s.authSwitch}>Бүртгэл байхгүй юу? <span style={s.authLink} onClick={()=>setPage("register")}>Бүртгүүлэх</span></p>
      </div>
    </div>
  );
}

function Register({ setPage, showToast }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  async function submit(e) {
    e.preventDefault(); setErr("");
    if (pw !== pw2) { setErr("Нууц үг таарахгүй байна."); return; }
    if (pw.length < 6) { setErr("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой."); return; }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pw);
      await updateProfile(cred.user, { displayName: name });
      showToast("Бүртгэл амжилттай үүслээ!");
      setPage("home");
    } catch (e) {
      if (e.code === "auth/email-already-in-use") setErr("Энэ имэйл бүртгэлтэй байна.");
      else setErr("Бүртгэл үүсгэхэд алдаа гарлаа.");
    }
  }
  return (
    <div style={s.authWrap}>
      <div style={s.authBox}>
        <div style={s.authLogo}>КИНО<span style={{color:"#FF3B3B"}}>ТАЙМ</span></div>
        <h2 style={s.authTitle}>Бүртгүүлэх</h2>
        <form onSubmit={submit} style={s.form}>
          <label style={s.label}>Нэр</label>
          <input style={s.input} value={name} onChange={(e)=>setName(e.target.value)} placeholder="Таны нэр" required />
          <label style={s.label}>Имэйл</label>
          <input style={s.input} type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="ta@example.com" required />
          <label style={s.label}>Нууц үг</label>
          <input style={s.input} type="password" value={pw} onChange={(e)=>setPw(e.target.value)} placeholder="••••••••" required />
          <label style={s.label}>Нууц үг давтах</label>
          <input style={s.input} type="password" value={pw2} onChange={(e)=>setPw2(e.target.value)} placeholder="••••••••" required />
          {err && <div style={s.errMsg}>{err}</div>}
          <button type="submit" style={s.btnRed}>Бүртгүүлэх</button>
        </form>
        <p style={s.authSwitch}>Бүртгэлтэй юу? <span style={s.authLink} onClick={()=>setPage("login")}>Нэвтрэх</span></p>
      </div>
    </div>
  );
}

function Admin({ movies, fetchMovies, showToast }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [posterFile, setPosterFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [posterPreview, setPosterPreview] = useState(null);

  function handlePoster(e) {
    const f = e.target.files[0]; if (!f) return;
    setPosterFile(f); setPosterPreview(URL.createObjectURL(f));
  }

  async function submit(e) {
    e.preventDefault();
    if (!title || !videoFile) { showToast("Гарчиг болон видео заавал шаардлагатай!", "error"); return; }
    if (CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME") {
      showToast("Cloudinary тохиргоогоо оруулна уу! (App.js дээр)", "error"); return;
    }
    setUploading(true); setProgress(0);
    try {
      let posterUrl = "";
      if (posterFile) {
        setProgressLabel("Постер байршуулж байна...");
        posterUrl = await uploadToCloudinary(posterFile, setProgress);
      }
      setProgressLabel("Видео байршуулж байна...");
      setProgress(0);
      const videoUrl = await uploadToCloudinary(videoFile, setProgress);

      await addDoc(collection(db, "movies"), {
        title, description: desc, poster: posterUrl, videoUrl, createdAt: serverTimestamp(),
      });
      showToast("Кино амжилттай нэмэгдлээ! 🎬");
      setTitle(""); setDesc(""); setPosterFile(null); setVideoFile(null); setPosterPreview(null);
      fetchMovies();
    } catch (err) {
      showToast("Upload алдаа: " + err.message, "error");
    }
    setUploading(false); setProgress(0); setProgressLabel("");
  }

  async function deleteMovie(id) {
    if (!window.confirm("Устгах уу?")) return;
    await deleteDoc(doc(db, "movies", id));
    fetchMovies(); showToast("Устгагдлаа.");
  }

  const [subRequests, setSubRequests] = React.useState([]);
  const [subLoading, setSubLoading] = React.useState(true);

  useEffect(() => {
    async function fetchSubs() {
      try {
        const snap = await getDocs(collection(db, "subscriptions"));
        setSubRequests(snap.docs.map(d => ({id:d.id, ...d.data()})));
      } catch {}
      setSubLoading(false);
    }
    fetchSubs();
  }, []);

  async function approveSub(uid) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + BANK_INFO.days);
    await updateDoc(doc(db, "subscriptions", uid), {
      status: "active",
      approvedAt: serverTimestamp(),
      expiresAt: expiry,
    });
    setSubRequests(prev => prev.map(r => r.id===uid ? {...r, status:"active", expiresAt:expiry} : r));
    showToast("Subscription батлагдлаа!");
  }

  async function rejectSub(uid) {
    await updateDoc(doc(db, "subscriptions", uid), { status: "rejected" });
    setSubRequests(prev => prev.map(r => r.id===uid ? {...r, status:"rejected"} : r));
    showToast("Татгалзлаа.");
  }

  const pending = subRequests.filter(r => r.status === "pending");
  const approved = subRequests.filter(r => r.status === "active");

  return (
    <div style={s.adminPage}>
      <h2 style={s.adminHeading}>Админ панель</h2>

      {/* Subscription хүсэлтүүд */}
      <div style={{...s.adminCard, borderColor: pending.length ? "#FF3B3B" : "#1a1a1a"}}>
        <h3 style={s.adminSubHeading}>
          Subscription хүсэлт
          {pending.length > 0 && (
            <span style={{marginLeft:10, background:"#FF3B3B", color:"#fff", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:10}}>{pending.length}</span>
          )}
        </h3>
        {subLoading && <p style={{color:"#555"}}>Ачааллаж байна...</p>}
        {!subLoading && subRequests.length === 0 && <p style={{color:"#555", fontSize:14}}>Одоогоор хүсэлт байхгүй байна.</p>}
        <div style={{display:"flex", flexDirection:"column", gap:10}}>
          {subRequests.map(r => (
            <div key={r.id} style={{
              background:"#161616", borderRadius:10, padding:"14px 16px",
              border:"1px solid " + (r.status==="pending" ? "#3a2000" : r.status==="active" ? "#0a2a0a" : "#2a0a0a"),
              display:"flex", alignItems:"center", gap:14,
            }}>
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4}}>
                  <span style={{fontSize:14, fontWeight:600, color:"#eee"}}>{r.name || r.email}</span>
                  <span style={{
                    fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                    padding:"2px 7px", borderRadius:4,
                    background: r.status==="pending" ? "rgba(255,150,0,0.15)" : r.status==="active" ? "rgba(29,185,84,0.15)" : "rgba(200,0,0,0.15)",
                    color: r.status==="pending" ? "#ffaa00" : r.status==="active" ? "#1db954" : "#e74c3c",
                  }}>{r.status==="pending" ? "Хүлээгдэж байна" : r.status==="active" ? "Идэвхтэй" : "Татгалзсан"}</span>
                </div>
                <div style={{fontSize:12, color:"#666", marginBottom:2}}>{r.email}</div>
                {r.note && <div style={{fontSize:12, color:"#888", background:"#0d0d0d", borderRadius:6, padding:"4px 8px", marginTop:4}}>💬 {r.note}</div>}
                {r.status==="active" && r.expiresAt && (
                  <div style={{fontSize:11, color:"#1db954", marginTop:4}}>
                    ✓ Дуусах: {(r.expiresAt instanceof Date ? r.expiresAt : r.expiresAt.toDate?.()).toLocaleDateString("mn-MN")}
                  </div>
                )}
              </div>
              {r.status === "pending" && (
                <div style={{display:"flex", gap:8, flexShrink:0}}>
                  <button onClick={() => approveSub(r.id)} style={{
                    background:"rgba(29,185,84,0.15)", border:"1px solid #1db954",
                    color:"#1db954", padding:"7px 16px", borderRadius:7,
                    cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                  }}>Батлах</button>
                  <button onClick={() => rejectSub(r.id)} style={{
                    background:"transparent", border:"1px solid #3a1010",
                    color:"#e74c3c", padding:"7px 14px", borderRadius:7,
                    cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif",
                  }}>Татгалзах</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cloudinary тохиргоо анхааруулга */}
      {CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME" && (
        <div style={s.warnBox}>
          ⚠️ <strong>Cloudinary тохиргоо хийгдээгүй байна.</strong> Доорх зааврыг дагана уу.
          <ol style={{marginTop:10,paddingLeft:20,lineHeight:2}}>
            <li><a href="https://cloudinary.com" target="_blank" rel="noreferrer" style={{color:"#FF3B3B"}}>cloudinary.com</a> дээр үнэгүй бүртгүүлнэ</li>
            <li>Dashboard → <strong>Cloud name</strong> хуулна</li>
            <li>Settings → Upload → <strong>Add upload preset</strong> → Signing Mode: <strong>Unsigned</strong> → Save</li>
            <li><code style={s.code}>App.js</code> дээр <code style={s.code}>CLOUDINARY_CLOUD_NAME</code> болон <code style={s.code}>CLOUDINARY_UPLOAD_PRESET</code> утгуудыг солино</li>
          </ol>
        </div>
      )}

      <div style={s.adminCard}>
        <h3 style={s.adminSubHeading}>Шинэ кино нэмэх</h3>
        <form onSubmit={submit} style={s.adminForm}>
          <div style={s.adminRow}>
            <div style={s.adminCol}>
              <label style={s.label}>Гарчиг *</label>
              <input style={s.input} value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Киноны нэр" />
              <label style={s.label}>Тайлбар</label>
              <textarea style={{...s.input, height:80, resize:"vertical"}} value={desc} onChange={(e)=>setDesc(e.target.value)} placeholder="Киноны товч тайлбар..." />
              <label style={s.label}>Постер зураг (JPG/PNG)</label>
              <input style={s.fileInput} type="file" accept="image/*" onChange={handlePoster} />
              <label style={s.label}>Видео файл (MP4) *</label>
              <input style={s.fileInput} type="file" accept="video/*" onChange={(e)=>setVideoFile(e.target.files[0])} />
            </div>
            {posterPreview && (
              <div style={s.adminPosterPreview}>
                <img src={posterPreview} alt="preview" style={{width:"100%",borderRadius:8}} />
              </div>
            )}
          </div>

          {uploading && (
            <div style={{margin:"16px 0"}}>
              <div style={{fontSize:13,color:"#aaa",marginBottom:6}}>{progressLabel}</div>
              <div style={s.progressTrack}>
                <div style={{...s.progressBar, width:`${progress}%`}} />
              </div>
              <div style={{fontSize:13,color:"#888",marginTop:4}}>{progress}%</div>
            </div>
          )}

          <button type="submit" style={{...s.btnRed, marginTop:16}} disabled={uploading}>
            {uploading ? "Байршуулж байна..." : "⬆ Upload хийх"}
          </button>
        </form>
      </div>

      <div style={s.adminCard}>
        <h3 style={s.adminSubHeading}>Нийт кино ({movies.length})</h3>
        {movies.length === 0 && <p style={{color:"#555"}}>Кино байхгүй байна.</p>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {movies.map((m) => (
            <div key={m.id} style={s.adminMovieRow}>
              {m.poster && <img src={m.poster} alt={m.title} style={s.adminThumb} />}
              {!m.poster && <div style={{...s.adminThumb, background:"#1a1a1a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20}}>🎬</div>}
              <div style={{flex:1}}>
                <div style={s.adminMovieTitle}>{m.title}</div>
                <div style={s.adminMovieDesc}>{m.description}</div>
              </div>
              <button style={s.deleteBtn} onClick={()=>deleteMovie(m.id)}>Устгах</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Toast({ msg, type }) {
  return <div style={{...s.toast, background:type==="error"?"#c0392b":"#1a7a3a"}}>{type==="error"?"⚠️ ":"✓ "}{msg}</div>;
}

// ══════════ SUBSCRIBE PAGE ══════════
function Subscribe({ user, setPage, subStatus, showToast }) {
  const [copied, setCopied] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [note, setNote] = React.useState("");

  function copyAccount() {
    navigator.clipboard?.writeText(BANK_INFO.account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendRequest() {
    if (!user) { setPage("login"); return; }
    if (!note.trim()) { showToast("Гүйлгээний дугаар оруулна уу!", "error"); return; }
    setSending(true);
    try {
      await setDoc(doc(db, "subscriptions", user.uid), {
        uid: user.uid,
        email: user.email,
        name: user.displayName || "",
        status: "pending",
        note: note.trim(),
        requestedAt: serverTimestamp(),
      });
      showToast("Хүсэлт илгээгдлээ! Админ шалгаад эрхийг нээнэ.");
      setPage("home");
    } catch(err) {
      showToast("Алдаа гарлаа: " + err.message, "error");
    }
    setSending(false);
  }

  return (
    <div style={{maxWidth:480, margin:"0 auto", padding:"48px 24px"}}>
      <button style={s.backBtn} onClick={()=>setPage("home")}>← Буцах</button>

      {subStatus === "pending" ? (
        <div style={{background:"#111", border:"1px solid #2a2a2a", borderRadius:16, padding:32, textAlign:"center"}}>
          <div style={{fontSize:48, marginBottom:16}}>⏳</div>
          <h2 style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:"#fff", margin:"0 0 10px"}}>Хүсэлт хүлээгдэж байна</h2>
          <p style={{color:"#777", fontSize:14, lineHeight:1.7}}>Таны subscription хүсэлтийг админ шалгаж байна. Удахгүй эрхийг нээнэ.</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{textAlign:"center", marginBottom:32}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:42, color:"#fff", letterSpacing:2}}>
              КИНО<span style={{color:"#FF3B3B"}}>ТАЙМ</span>
            </div>
            <div style={{fontSize:14, color:"#666", marginTop:4}}>Subscription авч бүх кинонд нэвтрэх</div>
          </div>

          {/* Plan card */}
          <div style={{background:"#111", border:"1.5px solid #FF3B3B", borderRadius:16, padding:28, marginBottom:20}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20}}>
              <div>
                <div style={{fontSize:11, color:"#FF3B3B", fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:4}}>Сарын эрх</div>
                <div style={{fontSize:36, fontWeight:800, color:"#fff"}}>{BANK_INFO.currency}{BANK_INFO.price}</div>
              </div>
              <div style={{background:"rgba(255,59,59,0.1)", borderRadius:10, padding:"8px 14px", textAlign:"center"}}>
                <div style={{fontSize:24, fontWeight:800, color:"#FF3B3B"}}>{BANK_INFO.days}</div>
                <div style={{fontSize:11, color:"#FF3B3B"}}>хоног</div>
              </div>
            </div>
            {["Бүх кино үзэх", "HD чанар", "Дурын төхөөрөмж", "Шинэ кино шууд харах"].map(f => (
              <div key={f} style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
                <span style={{color:"#FF3B3B", fontSize:16}}>✓</span>
                <span style={{color:"#ccc", fontSize:14}}>{f}</span>
              </div>
            ))}
          </div>

          {/* Bank info */}
          <div style={{background:"#111", border:"1px solid #222", borderRadius:14, padding:24, marginBottom:20}}>
            <div style={{fontSize:12, color:"#555", textTransform:"uppercase", letterSpacing:1.5, marginBottom:16}}>Шилжүүлэх дансны мэдээлэл</div>
            {[
              {label:"Банк", value: BANK_INFO.bank},
              {label:"Дансны нэр", value: BANK_INFO.name},
              {label:"Дансны дугаар", value: BANK_INFO.account, copy:true},
              {label:"Дүн", value: BANK_INFO.currency + BANK_INFO.price},
            ].map(({label, value, copy}) => (
              <div key={label} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #1a1a1a"}}>
                <span style={{fontSize:13, color:"#666"}}>{label}</span>
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <span style={{fontSize:14, color:"#fff", fontWeight: copy ? 700 : 400, fontFamily: copy ? "monospace" : "inherit", letterSpacing: copy ? 1 : 0}}>{value}</span>
                  {copy && (
                    <button onClick={copyAccount} style={{
                      background: copied ? "rgba(29,185,84,0.2)" : "#1a1a1a",
                      border:"1px solid " + (copied ? "#1db954" : "#2a2a2a"),
                      color: copied ? "#1db954" : "#888",
                      padding:"3px 10px", borderRadius:6, cursor:"pointer",
                      fontSize:11, fontFamily:"'DM Sans',sans-serif",
                    }}>
                      {copied ? "Хуулагдлаа ✓" : "Хуулах"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div style={{marginTop:14, background:"rgba(255,59,59,0.06)", border:"1px solid rgba(255,59,59,0.2)", borderRadius:8, padding:"10px 14px"}}>
              <div style={{fontSize:12, color:"#FF3B3B", fontWeight:600, marginBottom:4}}>⚠ Гүйлгээний утга</div>
              <div style={{fontSize:12, color:"#aaa"}}>Гүйлгээний утга хэсэгт <strong style={{color:"#fff"}}>"{user?.email}"</strong> гэж бичнэ үү</div>
            </div>
          </div>

          {/* Confirmation */}
          <div style={{background:"#111", border:"1px solid #222", borderRadius:14, padding:24}}>
            <div style={{fontSize:13, color:"#888", marginBottom:10}}>Мөнгө шилжүүлсний дараа гүйлгээний дугаар эсвэл дэлгэцийн зургийн тайлбар оруулна уу:</div>
            <textarea
              value={note}
              onChange={e=>setNote(e.target.value)}
              placeholder="Жишээ: 230501 гүйлгээ хийлээ"
              style={{...s.input, height:80, resize:"none", width:"100%", marginBottom:14}}
            />
            <button onClick={sendRequest} disabled={sending} style={{...s.btnRed, marginTop:0}}>
              {sending ? "Илгээж байна..." : "Хүсэлт илгээх"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ══════════ SUB GATE (subscription шаарддаг хуудас) ══════════
function SubGate({ setPage, subStatus }) {
  return (
    <div style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"80vh", padding:24, textAlign:"center"}}>
      <div style={{fontSize:64, marginBottom:16}}>🔒</div>
      <h2 style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:36, color:"#fff", margin:"0 0 10px", letterSpacing:2}}>Subscription шаардлагатай</h2>
      <p style={{color:"#777", fontSize:15, maxWidth:360, lineHeight:1.7, marginBottom:28}}>
        {subStatus === "pending"
          ? "Таны хүсэлт хүлээгдэж байна. Админ баталгаажуулсны дараа бүх кино харах боломжтой."
          : "Бүх кинонд нэвтрэхийн тулд subscription авна уу."}
      </p>
      <div style={{display:"flex", gap:12}}>
        <button style={s.backBtn} onClick={()=>setPage("home")}>← Буцах</button>
        {subStatus !== "pending" && (
          <button style={s.btnRed} onClick={()=>setPage("subscribe")}>Subscription авах</button>
        )}
      </div>
    </div>
  );
}


const playerCSS = `
  .kt-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 45%);
    display: flex; flex-direction: column; justify-content: flex-end;
    transition: opacity 0.3s;
  }
  .kt-overlay.kt-hidden { opacity: 0; pointer-events: none; }
  .kt-center-btn {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 72px; height: 72px; border-radius: 50%;
    background: rgba(255,255,255,0.12);
    border: 1.5px solid rgba(255,255,255,0.22);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: transform 0.15s, background 0.15s;
  }
  .kt-center-btn:hover { transform: translate(-50%,-50%) scale(1.1); background: rgba(255,59,59,0.35); }
  .kt-controls { padding: 12px 18px 16px; display: flex; flex-direction: column; gap: 10px; }
  .kt-prog {
    position: relative; height: 4px; background: rgba(255,255,255,0.15);
    border-radius: 2px; cursor: pointer; transition: height 0.15s;
  }
  .kt-prog:hover { height: 7px; }
  .kt-prog-buf { position:absolute; top:0; left:0; height:100%; background:rgba(255,255,255,0.22); border-radius:2px; pointer-events:none; }
  .kt-prog-fill { position:absolute; top:0; left:0; height:100%; background:#FF3B3B; border-radius:2px; pointer-events:none; }
  .kt-prog-fill::after { content:''; position:absolute; right:-5px; top:50%; transform:translateY(-50%);
    width:13px; height:13px; background:#fff; border-radius:50%; opacity:0; transition:opacity 0.15s; }
  .kt-prog:hover .kt-prog-fill::after { opacity:1; }
  .kt-btn { background:transparent; border:none; cursor:pointer; color:#ccc; display:flex; align-items:center;
    padding:4px; border-radius:4px; transition:color 0.15s; }
  .kt-btn:hover { color:#fff; }
  .kt-speed { background:rgba(255,255,255,0.1); border:none; color:#ccc; font-size:12px; font-weight:700;
    padding:3px 9px; border-radius:4px; cursor:pointer; transition:background 0.15s; font-family:inherit; }
  .kt-speed:hover { background:rgba(255,255,255,0.2); color:#fff; }
  .kt-spinner { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
    width:38px; height:38px; border:3px solid rgba(255,255,255,0.12); border-top-color:#FF3B3B;
    border-radius:50%; animation:kt-spin 0.8s linear infinite; display:none; }
  @keyframes kt-spin { to { transform:translate(-50%,-50%) rotate(360deg); } }
`;

const s = {
  root:{minHeight:"100vh",background:"#0a0a0a",color:"#f0f0f0",fontFamily:"'DM Sans',sans-serif"},
  splash:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#0a0a0a"},
  splashLogo:{fontFamily:"'Bebas Neue',sans-serif",fontSize:56,letterSpacing:4,color:"#fff"},
  nav:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",height:64,background:"rgba(10,10,10,0.96)",borderBottom:"1px solid #1c1c1c",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(10px)"},
  navLogo:{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,letterSpacing:3,cursor:"pointer",color:"#fff"},
  navLinks:{display:"flex",alignItems:"center",gap:10},
  navUser:{fontSize:14,color:"#888",marginRight:4},
  navBtn:{background:"transparent",border:"1px solid #2a2a2a",color:"#aaa",padding:"7px 18px",borderRadius:6,cursor:"pointer",fontSize:14,fontFamily:"'DM Sans',sans-serif"},
  navBtnActive:{background:"#1c1c1c",border:"1px solid #444",color:"#fff",padding:"7px 18px",borderRadius:6,cursor:"pointer",fontSize:14,fontFamily:"'DM Sans',sans-serif"},
  navBtnRed:{background:"#FF3B3B",border:"none",color:"#fff",padding:"7px 20px",borderRadius:6,cursor:"pointer",fontSize:14,fontWeight:600,fontFamily:"'DM Sans',sans-serif"},
  page:{maxWidth:1280,margin:"0 auto"},
  emptyHero:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:300},
  hero:{position:"relative",height:500,backgroundSize:"cover",backgroundPosition:"center",overflow:"hidden"},
  heroOverlay:{position:"absolute",inset:0,background:"linear-gradient(to right, rgba(10,10,10,0.95) 35%, transparent 80%)",display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 60px"},
  heroTag:{background:"#FF3B3B",color:"#fff",fontSize:11,fontWeight:700,letterSpacing:2,padding:"4px 10px",borderRadius:4,display:"inline-block",marginBottom:14,width:"fit-content",textTransform:"uppercase"},
  heroTitle:{fontFamily:"'Bebas Neue',sans-serif",fontSize:60,letterSpacing:2,margin:"0 0 10px",lineHeight:1,maxWidth:500},
  heroDesc:{fontSize:14,color:"#bbb",maxWidth:400,marginBottom:24,lineHeight:1.7},
  heroBtn:{background:"#FF3B3B",border:"none",color:"#fff",padding:"13px 32px",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"},
  tabBar:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 40px",borderBottom:"1px solid #1a1a1a",marginTop:4},
  tabInner:{display:"flex",gap:0},
  tabBtn:{background:"transparent",border:"none",borderBottom:"2px solid transparent",color:"#666",padding:"16px 20px",cursor:"pointer",fontSize:14,fontWeight:500,fontFamily:"'DM Sans',sans-serif",transition:"color 0.2s",display:"flex",alignItems:"center"},
  tabSearch:{padding:"8px 16px",background:"#141414",border:"1px solid #222",borderRadius:50,color:"#fff",fontSize:14,outline:"none",fontFamily:"'DM Sans',sans-serif",width:200},
  searchWrap:{padding:"28px 40px 0"},
  searchInput:{width:"100%",maxWidth:420,padding:"11px 20px",background:"#141414",border:"1px solid #222",borderRadius:50,color:"#fff",fontSize:15,outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box"},
  gridWrap:{padding:"28px 40px 60px"},
  sectionTitle:{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,letterSpacing:2,marginBottom:20,color:"#fff"},
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:18},
  card:{background:"#111",borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"transform 0.2s ease,box-shadow 0.2s ease"},
  cardImg:{width:"100%",aspectRatio:"2/3",objectFit:"cover",display:"block"},
  cardNoImg:{width:"100%",aspectRatio:"2/3",display:"flex",alignItems:"center",justifyContent:"center",background:"#1a1a1a",fontSize:48},
  cardBody:{padding:"12px 14px"},
  cardTitle:{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,letterSpacing:1,marginBottom:4,color:"#fff"},
  cardDesc:{fontSize:12,color:"#666",lineHeight:1.5,marginBottom:8,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"},
  cardPlay:{fontSize:13,color:"#FF3B3B",fontWeight:600},
  watchPage:{maxWidth:960,margin:"0 auto",padding:"36px 32px"},
  backBtn:{background:"transparent",border:"1px solid #2a2a2a",color:"#aaa",padding:"8px 18px",borderRadius:6,cursor:"pointer",fontSize:14,marginBottom:18,fontFamily:"'DM Sans',sans-serif"},
  watchTitle:{fontFamily:"'Bebas Neue',sans-serif",fontSize:40,letterSpacing:2,marginBottom:18,color:"#fff"},
  playerWrap:{background:"#000",borderRadius:12,overflow:"hidden",marginBottom:20},
  player:{width:"100%",maxHeight:540,display:"block"},
  watchDesc:{color:"#888",fontSize:15,lineHeight:1.7},
  authWrap:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"calc(100vh - 64px)",padding:20},
  authBox:{background:"#111",borderRadius:16,padding:"44px 36px",width:"100%",maxWidth:400,border:"1px solid #1e1e1e"},
  authLogo:{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,letterSpacing:3,textAlign:"center",marginBottom:6,color:"#fff"},
  authTitle:{textAlign:"center",marginBottom:24,fontSize:18,fontWeight:400,color:"#999"},
  form:{display:"flex",flexDirection:"column",gap:2},
  label:{fontSize:12,color:"#666",marginBottom:4,marginTop:12,textTransform:"uppercase",letterSpacing:1},
  input:{padding:"11px 14px",background:"#161616",border:"1px solid #222",borderRadius:8,color:"#fff",fontSize:15,outline:"none",fontFamily:"'DM Sans',sans-serif",width:"100%",boxSizing:"border-box"},
  fileInput:{color:"#777",fontSize:14,marginTop:6},
  errMsg:{background:"#1a0000",border:"1px solid #3a0000",color:"#ff6b6b",padding:"10px 14px",borderRadius:8,fontSize:13,marginTop:8},
  btnRed:{background:"#FF3B3B",border:"none",color:"#fff",padding:"13px 24px",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer",marginTop:18,fontFamily:"'DM Sans',sans-serif",width:"100%"},
  authSwitch:{textAlign:"center",marginTop:18,color:"#555",fontSize:14},
  authLink:{color:"#FF3B3B",cursor:"pointer",fontWeight:600},
  adminPage:{maxWidth:860,margin:"0 auto",padding:"36px 32px"},
  adminHeading:{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,letterSpacing:2,marginBottom:22,color:"#fff"},
  warnBox:{background:"#1a1200",border:"1px solid #4a3500",borderRadius:12,padding:"18px 22px",marginBottom:20,fontSize:14,lineHeight:1.7,color:"#e8c56a"},
  code:{background:"#111",padding:"2px 6px",borderRadius:4,fontFamily:"monospace",fontSize:13},
  adminCard:{background:"#111",border:"1px solid #1a1a1a",borderRadius:14,padding:24,marginBottom:20},
  adminSubHeading:{fontSize:15,fontWeight:600,color:"#bbb",marginBottom:18},
  adminForm:{display:"flex",flexDirection:"column",gap:2},
  adminRow:{display:"flex",gap:20,alignItems:"flex-start"},
  adminCol:{flex:1,display:"flex",flexDirection:"column"},
  adminPosterPreview:{width:140,flexShrink:0},
  progressTrack:{background:"#1a1a1a",borderRadius:50,height:6,overflow:"hidden"},
  progressBar:{height:"100%",background:"#FF3B3B",borderRadius:50,transition:"width 0.2s"},
  adminMovieRow:{display:"flex",alignItems:"center",gap:14,background:"#161616",borderRadius:10,padding:"10px 14px"},
  adminThumb:{width:44,height:58,objectFit:"cover",borderRadius:6,flexShrink:0},
  adminMovieTitle:{fontWeight:600,marginBottom:3,color:"#ddd",fontSize:14},
  adminMovieDesc:{fontSize:12,color:"#555"},
  deleteBtn:{background:"transparent",border:"1px solid #3a1010",color:"#e74c3c",padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:13,whiteSpace:"nowrap",fontFamily:"'DM Sans',sans-serif"},
  toast:{position:"fixed",bottom:28,right:28,padding:"13px 22px",borderRadius:10,color:"#fff",fontWeight:600,fontSize:14,zIndex:999,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"},
};

const css = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #0a0a0a; }
  input::placeholder, textarea::placeholder { color: #444; }
  input:focus, textarea:focus { border-color: #FF3B3B !important; }
  button:hover { opacity: 0.85; }
  button:disabled { opacity: 0.45; cursor: not-allowed; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #0a0a0a; }
  ::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }
`;

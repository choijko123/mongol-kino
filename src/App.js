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
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

// ─── CLOUDINARY ТОХИРГОО ───────────────────────────────────────────
// cloudinary.com дээр бүртгүүлж дараах утгуудыг оруулна:
const CLOUDINARY_CLOUD_NAME = "dfoisc49h";   // жишээ: "dxyz123abc"
const CLOUDINARY_UPLOAD_PRESET = "padzzmf3"; // unsigned preset нэр
// ──────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = "admin@movie.mn";

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

  function openWatch(movie) { setWatchMovie(movie); setPage("watch"); }

  if (loading) return <Splash />;
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div style={s.root}>
      <style>{css}</style>
      <Nav user={user} isAdmin={isAdmin} page={page} setPage={setPage} />
      {toast && <Toast {...toast} />}
      {page === "home" && <Home movies={movies} user={user} setPage={setPage} openWatch={openWatch} />}
      {page === "login" && <Login setPage={setPage} showToast={showToast} />}
      {page === "register" && <Register setPage={setPage} showToast={showToast} />}
      {page === "admin" && isAdmin && <Admin movies={movies} fetchMovies={fetchMovies} showToast={showToast} />}
      {page === "watch" && watchMovie && <Watch movie={watchMovie} setPage={setPage} />}
    </div>
  );
}

function Splash() {
  return <div style={s.splash}><div style={s.splashLogo}>КИНО<span style={{color:"#FF3B3B"}}>ТАЙМ</span></div></div>;
}

function Nav({ user, isAdmin, page, setPage }) {
  async function logout() { await signOut(auth); setPage("home"); }
  return (
    <nav style={s.nav}>
      <div style={s.navLogo} onClick={() => setPage("home")}>КИНО<span style={{color:"#FF3B3B"}}>ТАЙМ</span></div>
      <div style={s.navLinks}>
        {user ? (
          <>
            <span style={s.navUser}>👤 {user.displayName || user.email.split("@")[0]}</span>
            {isAdmin && <button style={page==="admin"?s.navBtnActive:s.navBtn} onClick={()=>setPage("admin")}>Админ</button>}
            <button style={s.navBtn} onClick={logout}>Гарах</button>
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

function Home({ movies, user, setPage, openWatch }) {
  const [search, setSearch] = useState("");
  const filtered = movies.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={s.page}>
      {movies[0] && (
        <div style={{...s.hero, backgroundImage:`url(${movies[0].poster})`}}>
          <div style={s.heroOverlay}>
            <div style={s.heroTag}>Шинэ кино</div>
            <h1 style={s.heroTitle}>{movies[0].title}</h1>
            <p style={s.heroDesc}>{movies[0].description}</p>
            <button style={s.heroBtn} onClick={() => { if(!user){setPage("login");return;} openWatch(movies[0]); }}>▶ &nbsp;Үзэх</button>
          </div>
        </div>
      )}
      {movies.length === 0 && (
        <div style={s.emptyHero}>
          <div style={s.splashLogo}>КИНО<span style={{color:"#FF3B3B"}}>ТАЙМ</span></div>
          <p style={{color:"#555",marginTop:16}}>Удахгүй кинонууд нэмэгдэнэ...</p>
        </div>
      )}
      <div style={s.searchWrap}>
        <input style={s.searchInput} placeholder="🔍  Кино хайх..." value={search} onChange={(e)=>setSearch(e.target.value)} />
      </div>
      <div style={s.gridWrap}>
        <h2 style={s.sectionTitle}>Бүх кино</h2>
        {filtered.length === 0 && <p style={{color:"#555",textAlign:"center",marginTop:40}}>Кино олдсонгүй</p>}
        <div style={s.grid}>
          {filtered.map((m) => <MovieCard key={m.id} movie={m} user={user} setPage={setPage} openWatch={openWatch} />)}
        </div>
      </div>
    </div>
  );
}

function MovieCard({ movie, user, setPage, openWatch }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{...s.card, transform:hovered?"scale(1.04)":"scale(1)", boxShadow:hovered?"0 8px 32px rgba(255,59,59,0.2)":"0 4px 20px rgba(0,0,0,0.4)"}}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      onClick={()=>{ if(!user){setPage("login");return;} openWatch(movie); }}>
      {movie.poster ? <img src={movie.poster} alt={movie.title} style={s.cardImg} /> : <div style={s.cardNoImg}>🎬</div>}
      <div style={s.cardBody}>
        <div style={s.cardTitle}>{movie.title}</div>
        <div style={s.cardDesc}>{movie.description}</div>
        <div style={s.cardPlay}>▶ Үзэх</div>
      </div>
    </div>
  );
}

function Watch({ movie, setPage }) {
  return (
    <div style={s.watchPage}>
      <button style={s.backBtn} onClick={()=>setPage("home")}>← Буцах</button>
      <h2 style={s.watchTitle}>{movie.title}</h2>
      <div style={s.playerWrap}>
        <video src={movie.videoUrl} controls autoPlay style={s.player} />
      </div>
      <p style={s.watchDesc}>{movie.description}</p>
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

  return (
    <div style={s.adminPage}>
      <h2 style={s.adminHeading}>Админ панель</h2>

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

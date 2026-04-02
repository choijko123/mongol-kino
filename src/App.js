import { useState, useEffect, useRef } from "react";
import { collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, auth, storage } from "./firebase";

const ADMIN_EMAIL = "admin@movie.mn";

const SAMPLE_MOVIES = [
  { id: "1", title: "Big Buck Bunny", genre: "Монгол", year: 2023, duration: "1ц 45мин", rating: 8.2, description: "Монгол нутгийн өргөн тал дэх хайр, зориг, амьдралын тухай үнэн түүх.", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=580&fit=crop", videoUrl: "", youtubeId: "aqz-KE-bpKQ", featured: true },
  { id: "2", title: "Elephant Dream", genre: "Триллер", year: 2022, duration: "2ц 10мин", rating: 7.8, description: "Нуур дотор нуугдсан нууцыг задруулахаар мөрдөн байцаагч тулгарна.", poster: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=580&fit=crop", videoUrl: "", youtubeId: "XSGBVzeBUbk", featured: false },
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root { --bg: #080c14; --surface: #0f1623; --card: #141d2e; --border: #1e2d45; --accent: #e8a020; --accent2: #c0392b; --text: #e8edf5; --muted: #6b7a94; --success: #27ae60; }
  body { background: var(--bg); color: var(--text); font-family: 'Outfit', sans-serif; min-height: 100vh; }
  .app { min-height: 100vh; }
  .loading { display:flex; align-items:center; justify-content:center; height:100vh; background:var(--bg); color:var(--muted); font-size:16px; }
  .auth-bg { min-height:100vh; background:linear-gradient(135deg,#080c14 0%,#0d1829 50%,#080c14 100%); display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; }
  .auth-bg::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse at 30% 50%,rgba(232,160,32,0.08) 0%,transparent 60%),radial-gradient(ellipse at 70% 50%,rgba(192,57,43,0.06) 0%,transparent 60%); }
  .auth-box { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:48px 40px; width:440px; max-width:95vw; position:relative; z-index:1; box-shadow:0 32px 80px rgba(0,0,0,0.6); }
  .auth-logo { text-align:center; margin-bottom:32px; }
  .auth-logo .logo-text { font-family:'Bebas Neue'; font-size:42px; letter-spacing:4px; color:var(--accent); }
  .auth-logo .logo-sub { font-size:12px; color:var(--muted); letter-spacing:3px; text-transform:uppercase; }
  .auth-tabs { display:flex; margin-bottom:28px; border:1px solid var(--border); border-radius:8px; overflow:hidden; }
  .auth-tab { flex:1; padding:10px; text-align:center; cursor:pointer; font-size:14px; font-weight:500; background:transparent; border:none; color:var(--muted); transition:all 0.2s; }
  .auth-tab.active { background:var(--accent); color:#000; font-weight:600; }
  .form-group { margin-bottom:16px; }
  .form-group label { display:block; font-size:12px; font-weight:500; color:var(--muted); margin-bottom:6px; letter-spacing:1px; text-transform:uppercase; }
  .form-group input, .form-group select, .form-group textarea { width:100%; background:var(--card); border:1px solid var(--border); border-radius:8px; padding:12px 16px; color:var(--text); font-size:14px; font-family:'Outfit',sans-serif; outline:none; transition:border-color 0.2s; }
  .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color:var(--accent); }
  .form-group textarea { resize:vertical; min-height:80px; }
  .btn-primary { width:100%; background:var(--accent); color:#000; border:none; border-radius:8px; padding:14px; font-size:15px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; letter-spacing:1px; transition:opacity 0.2s; margin-top:8px; }
  .btn-primary:hover { opacity:0.88; }
  .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
  .error-msg { background:rgba(192,57,43,0.15); border:1px solid rgba(192,57,43,0.4); color:#e74c3c; padding:10px 14px; border-radius:8px; font-size:13px; margin-bottom:16px; }
  .success-msg { background:rgba(39,174,96,0.15); border:1px solid rgba(39,174,96,0.4); color:#27ae60; padding:10px 14px; border-radius:8px; font-size:13px; margin-bottom:16px; }
  .admin-hint { text-align:center; margin-top:16px; font-size:12px; color:var(--muted); }
  .navbar { background:rgba(8,12,20,0.95); backdrop-filter:blur(12px); border-bottom:1px solid var(--border); padding:0 40px; height:64px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; }
  .nav-logo { font-family:'Bebas Neue'; font-size:28px; letter-spacing:3px; color:var(--accent); }
  .nav-right { display:flex; align-items:center; gap:16px; }
  .nav-user { font-size:14px; color:var(--muted); }
  .nav-user strong { color:var(--text); }
  .btn-nav { background:transparent; border:1px solid var(--border); color:var(--muted); padding:6px 16px; border-radius:6px; cursor:pointer; font-size:13px; font-family:'Outfit'; transition:all 0.2s; }
  .btn-nav:hover { border-color:var(--accent2); color:var(--accent2); }
  .btn-nav.active { border-color:var(--accent); color:var(--accent); }
  .badge-admin { background:var(--accent); color:#000; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; letter-spacing:1px; }
  .hero { position:relative; height:520px; overflow:hidden; display:flex; align-items:flex-end; }
  .hero-bg { position:absolute; inset:0; }
  .hero-bg img { width:100%; height:100%; object-fit:cover; }
  .hero-bg::after { content:''; position:absolute; inset:0; background:linear-gradient(to right,rgba(8,12,20,0.95) 0%,rgba(8,12,20,0.6) 50%,rgba(8,12,20,0.2) 100%),linear-gradient(to top,rgba(8,12,20,1) 0%,transparent 40%); }
  .hero-content { position:relative; z-index:1; padding:48px; max-width:600px; }
  .hero-badge { display:inline-block; background:var(--accent); color:#000; font-size:10px; font-weight:700; padding:4px 12px; border-radius:4px; letter-spacing:2px; margin-bottom:16px; }
  .hero-title { font-family:'Bebas Neue'; font-size:64px; line-height:1; letter-spacing:2px; margin-bottom:12px; }
  .hero-meta { display:flex; gap:16px; margin-bottom:16px; font-size:13px; color:var(--muted); flex-wrap:wrap; }
  .hero-meta .rating { color:var(--accent); font-weight:600; }
  .hero-desc { font-size:15px; color:#9aa5b8; line-height:1.6; margin-bottom:28px; }
  .btn-watch { background:var(--accent); color:#000; border:none; padding:14px 32px; border-radius:8px; font-size:15px; font-weight:700; cursor:pointer; font-family:'Outfit'; display:inline-flex; align-items:center; gap:8px; transition:all 0.2s; }
  .btn-watch:hover { background:#f0b030; transform:translateY(-1px); }
  .section { padding:40px 48px; }
  .section-title { font-family:'Bebas Neue'; font-size:28px; letter-spacing:2px; color:var(--text); margin-bottom:24px; display:flex; align-items:center; gap:12px; }
  .section-title::after { content:''; flex:1; height:1px; background:var(--border); }
  .movie-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:20px; }
  .movie-card { background:var(--card); border-radius:10px; overflow:hidden; cursor:pointer; transition:transform 0.2s,box-shadow 0.2s; border:1px solid var(--border); }
  .movie-card:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,0.5); border-color:var(--accent); }
  .movie-card img { width:100%; height:280px; object-fit:cover; display:block; }
  .movie-info { padding:14px; }
  .movie-title-text { font-size:15px; font-weight:600; margin-bottom:6px; }
  .movie-meta-row { display:flex; justify-content:space-between; font-size:12px; color:var(--muted); }
  .movie-rating { color:var(--accent); font-weight:600; }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.92); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
  .modal-box { background:var(--surface); border-radius:12px; width:100%; max-width:900px; border:1px solid var(--border); overflow:hidden; max-height:90vh; overflow-y:auto; }
  .modal-header { padding:20px 24px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); }
  .modal-title { font-family:'Bebas Neue'; font-size:26px; letter-spacing:2px; }
  .modal-close { background:none; border:none; color:var(--muted); font-size:22px; cursor:pointer; width:36px; height:36px; border-radius:6px; transition:all 0.2s; }
  .modal-close:hover { background:var(--border); color:var(--text); }
  .modal-video { background:#000; }
  .modal-video video { width:100%; max-height:500px; display:block; }
  .modal-video iframe { display:block; }
  .modal-desc { padding:20px 24px; font-size:14px; color:var(--muted); line-height:1.6; }
  .modal-tags { display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
  .tag { background:var(--card); border:1px solid var(--border); padding:4px 12px; border-radius:20px; font-size:12px; color:var(--muted); }
  .admin-panel { padding:40px 48px; }
  .admin-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; }
  .admin-header h1 { font-family:'Bebas Neue'; font-size:36px; letter-spacing:3px; }
  .btn-add { background:var(--accent); color:#000; border:none; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer; font-family:'Outfit'; display:inline-flex; align-items:center; gap:8px; }
  .btn-add:hover { opacity:0.88; }
  .admin-form { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:32px; margin-bottom:32px; }
  .admin-form h2 { font-family:'Bebas Neue'; font-size:24px; letter-spacing:2px; margin-bottom:24px; color:var(--accent); }
  .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .form-grid .full { grid-column:1/-1; }
  .form-actions { display:flex; gap:12px; margin-top:20px; }
  .btn-save { background:var(--success); color:#fff; border:none; padding:12px 28px; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; font-family:'Outfit'; }
  .btn-save:disabled { opacity:0.5; cursor:not-allowed; }
  .btn-cancel { background:transparent; color:var(--muted); border:1px solid var(--border); padding:12px 20px; border-radius:8px; font-size:14px; cursor:pointer; font-family:'Outfit'; }
  .admin-table { background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; overflow-x:auto; }
  .admin-table table { width:100%; border-collapse:collapse; min-width:600px; }
  .admin-table th { padding:14px 20px; text-align:left; font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:1px; background:var(--card); border-bottom:1px solid var(--border); }
  .admin-table td { padding:12px 20px; font-size:14px; border-bottom:1px solid rgba(30,45,69,0.5); vertical-align:middle; }
  .admin-table tr:last-child td { border-bottom:none; }
  .admin-table tr:hover td { background:rgba(232,160,32,0.03); }
  .admin-table img { width:44px; height:60px; object-fit:cover; border-radius:4px; }
  .btn-edit { background:transparent; border:1px solid var(--border); color:var(--muted); padding:5px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-family:'Outfit'; margin-right:6px; }
  .btn-edit:hover { border-color:var(--accent); color:var(--accent); }
  .btn-delete { background:transparent; border:1px solid rgba(192,57,43,0.3); color:var(--accent2); padding:5px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-family:'Outfit'; }
  .btn-delete:hover { background:rgba(192,57,43,0.15); }
  .genre-badge { background:rgba(232,160,32,0.12); color:var(--accent); font-size:11px; padding:2px 10px; border-radius:20px; font-weight:500; }
  .checkbox-label { display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px; }
  .checkbox-label input[type=checkbox] { width:16px; height:16px; accent-color:var(--accent); }

  /* UPLOAD */
  .upload-area { border:2px dashed var(--border); border-radius:10px; padding:24px; text-align:center; cursor:pointer; transition:all 0.2s; background:var(--card); position:relative; }
  .upload-area:hover, .upload-area.drag { border-color:var(--accent); background:rgba(232,160,32,0.05); }
  .upload-area input[type=file] { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }
  .upload-icon { font-size:28px; margin-bottom:8px; }
  .upload-label { font-size:13px; color:var(--muted); }
  .upload-label strong { color:var(--accent); }
  .upload-filename { font-size:12px; color:var(--success); margin-top:6px; }
  .progress-bar { height:6px; background:var(--border); border-radius:3px; margin-top:10px; overflow:hidden; }
  .progress-fill { height:100%; background:var(--accent); border-radius:3px; transition:width 0.3s; }
  .progress-text { font-size:11px; color:var(--muted); margin-top:4px; text-align:center; }
  .video-source-tabs { display:flex; gap:0; margin-bottom:12px; border:1px solid var(--border); border-radius:8px; overflow:hidden; }
  .vsource-tab { flex:1; padding:8px; text-align:center; cursor:pointer; font-size:13px; background:transparent; border:none; color:var(--muted); font-family:'Outfit'; transition:all 0.2s; }
  .vsource-tab.active { background:var(--accent); color:#000; font-weight:600; }
  .poster-preview { width:100%; height:120px; object-fit:cover; border-radius:8px; margin-top:8px; border:1px solid var(--border); }
  .video-badge { display:inline-block; background:rgba(39,174,96,0.15); border:1px solid rgba(39,174,96,0.3); color:#27ae60; font-size:11px; padding:2px 10px; border-radius:20px; }
`;

// ── UPLOAD COMPONENT ──────────────────────────────────────────
function FileUpload({ accept, label, icon, storagePath, onUploaded, currentUrl }) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [filename, setFilename] = useState("");
  const [drag, setDrag] = useState(false);

  const upload = (file) => {
    if (!file) return;
    setFilename(file.name);
    setUploading(true);
    setProgress(0);
    const storageRef = ref(storage, storagePath + "/" + Date.now() + "_" + file.name);
    const task = uploadBytesResumable(storageRef, file);
    task.on("state_changed",
      snap => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      err => { alert("Upload алдаа: " + err.message); setUploading(false); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        onUploaded(url);
        setUploading(false);
      }
    );
  };

  return (
    <div>
      <div className={"upload-area" + (drag ? " drag" : "")}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files[0]); }}>
        <input type="file" accept={accept} onChange={e => upload(e.target.files[0])} />
        <div className="upload-icon">{icon}</div>
        <div className="upload-label">{label}<br /><strong>Файл сонгох</strong> эсвэл чирж тавина</div>
        {filename && <div className="upload-filename">✓ {filename}</div>}
      </div>
      {uploading && (
        <div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: progress + "%" }} /></div>
          <div className="progress-text">Uploading... {progress}%</div>
        </div>
      )}
      {!uploading && currentUrl && <div style={{ marginTop: 6, fontSize: 12 }}><span className="video-badge">✓ Файл байршсан</span></div>}
    </div>
  );
}

// ── AUTH ──────────────────────────────────────────────────────
function AuthScreen() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Бүх талбарыг бөглөнө үү."); return; }
    setLoading(true); setError("");
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch { setError("Имэйл эсвэл нууц үг буруу."); }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!name || !email || !password) { setError("Бүх талбарыг бөглөнө үү."); return; }
    if (password.length < 6) { setError("Нууц үг 6+ тэмдэгт байх ёстой."); return; }
    setLoading(true); setError("");
    try {
      const c = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(c.user, { displayName: name });
      setInfo("Бүртгэл амжилттай!");
    } catch (e) {
      setError(e.code === "auth/email-already-in-use" ? "Имэйл бүртгэлтэй байна." : "Алдаа гарлаа.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-bg">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="logo-text">КИНОТАЙМ</div>
          <div className="logo-sub">Mongolia Streaming</div>
        </div>
        <div className="auth-tabs">
          <button className={"auth-tab" + (tab === "login" ? " active" : "")} onClick={() => { setTab("login"); setError(""); setInfo(""); }}>Нэвтрэх</button>
          <button className={"auth-tab" + (tab === "register" ? " active" : "")} onClick={() => { setTab("register"); setError(""); setInfo(""); }}>Бүртгүүлэх</button>
        </div>
        {error && <div className="error-msg">{error}</div>}
        {info && <div className="success-msg">{info}</div>}
        {tab === "register" && (
          <div className="form-group">
            <label>Нэр</label>
            <input type="text" placeholder="Таны нэр" value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}
        <div className="form-group">
          <label>Имэйл</label>
          <input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Нууц үг</label>
          <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (tab === "login" ? handleLogin() : handleRegister())} />
        </div>
        <button className="btn-primary" disabled={loading} onClick={tab === "login" ? handleLogin : handleRegister}>
          {loading ? "Түр хүлээнэ үү..." : (tab === "login" ? "Нэвтрэх" : "Бүртгүүлэх")}
        </button>
        <div className="admin-hint">Админ: {ADMIN_EMAIL}</div>
      </div>
    </div>
  );
}

// ── NAVBAR ────────────────────────────────────────────────────
function Navbar({ user, view, setView }) {
  const isAdmin = user?.email === ADMIN_EMAIL;
  return (
    <nav className="navbar">
      <div className="nav-logo">КИНОТАЙМ</div>
      <div className="nav-right">
        {isAdmin && <>
          <button className={"btn-nav" + (view === "home" ? " active" : "")} onClick={() => setView("home")}>Кинонууд</button>
          <button className={"btn-nav" + (view === "admin" ? " active" : "")} onClick={() => setView("admin")}>Админ</button>
        </>}
        <div className="nav-user">{isAdmin && <span className="badge-admin">ADMIN</span>} <strong>{user?.displayName || user?.email}</strong></div>
        <button className="btn-nav" onClick={() => signOut(auth)}>Гарах</button>
      </div>
    </nav>
  );
}

// ── VIDEO MODAL ───────────────────────────────────────────────
function VideoModal({ movie, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{movie.title}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-video">
          {movie.videoUrl ? (
            <video controls autoPlay style={{ width: "100%", maxHeight: 500 }}>
              <source src={movie.videoUrl} type="video/mp4" />
            </video>
          ) : movie.youtubeId ? (
            <iframe width="100%" height="460"
              src={"https://www.youtube.com/embed/" + movie.youtubeId + "?autoplay=1"}
              title={movie.title} frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen style={{ display: "block" }} />
          ) : (
            <div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>Видео байхгүй байна</div>
          )}
        </div>
        <div className="modal-desc">
          {movie.description}
          <div className="modal-tags">
            <span className="tag">📅 {movie.year}</span>
            <span className="tag">⏱ {movie.duration}</span>
            <span className="tag">⭐ {movie.rating}</span>
            <span className="tag">🎭 {movie.genre}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HOME VIEW ─────────────────────────────────────────────────
function HomeView({ movies, onWatch }) {
  const featured = movies.find(m => m.featured) || movies[0];
  return (
    <div>
      {featured && (
        <div className="hero">
          <div className="hero-bg"><img src={featured.poster} alt={featured.title} /></div>
          <div className="hero-content">
            <div className="hero-badge">ОНЦЛОХ КИНО</div>
            <div className="hero-title">{featured.title}</div>
            <div className="hero-meta">
              <span className="rating">⭐ {featured.rating}</span>
              <span>{featured.year}</span><span>{featured.duration}</span><span>{featured.genre}</span>
            </div>
            <div className="hero-desc">{featured.description}</div>
            <button className="btn-watch" onClick={() => onWatch(featured)}>▶ Үзэх</button>
          </div>
        </div>
      )}
      <div className="section">
        <div className="section-title">Бүх Кинонууд</div>
        <div className="movie-grid">
          {movies.map(m => (
            <div className="movie-card" key={m.id} onClick={() => onWatch(m)}>
              <img src={m.poster} alt={m.title} />
              <div className="movie-info">
                <div className="movie-title-text">{m.title}</div>
                <div className="movie-meta-row">
                  <span>{m.year} · {m.genre}</span>
                  <span className="movie-rating">★ {m.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {movies.length === 0 && <div style={{ color: "var(--muted)", textAlign: "center", padding: "60px 0" }}>Кино байхгүй байна.</div>}
      </div>
    </div>
  );
}

// ── ADMIN VIEW ────────────────────────────────────────────────
const emptyForm = { title: "", genre: "Монгол", year: new Date().getFullYear(), duration: "", rating: "", description: "", poster: "", videoUrl: "", youtubeId: "", featured: false };

function AdminView({ movies }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [videoSource, setVideoSource] = useState("upload"); // "upload" | "youtube"

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const saveMovie = async () => {
    if (!form.title) { alert("Кино нэр оруулна уу."); return; }
    if (videoSource === "upload" && !form.videoUrl) { alert("Видео файл upload хийнэ үү."); return; }
    if (videoSource === "youtube" && !form.youtubeId) { alert("YouTube ID оруулна уу."); return; }
    if (!form.poster) { alert("Постер оруулна уу."); return; }
    setSaving(true);
    const id = editId || Date.now().toString();
    const movie = {
      ...form,
      id,
      year: +form.year,
      rating: +form.rating,
      videoUrl: videoSource === "upload" ? form.videoUrl : "",
      youtubeId: videoSource === "youtube" ? form.youtubeId : "",
    };
    await setDoc(doc(db, "movies", id), movie);
    setShowForm(false); setForm(emptyForm); setEditId(null); setSaving(false);
  };

  const deleteMovie = async (m) => {
    if (!window.confirm("Устгах уу?")) return;
    if (m.videoUrl) {
      try { await deleteObject(ref(storage, m.videoUrl)); } catch {}
    }
    await deleteDoc(doc(db, "movies", m.id));
  };

  const startEdit = (m) => {
    setForm({ ...m });
    setEditId(m.id);
    setVideoSource(m.videoUrl ? "upload" : "youtube");
    setShowForm(true);
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Кино Удирдлага</h1>
        <button className="btn-add" onClick={() => { setShowForm(true); setForm(emptyForm); setEditId(null); setVideoSource("upload"); }}>+ Кино нэмэх</button>
      </div>

      {showForm && (
        <div className="admin-form">
          <h2>{editId ? "Кино засах" : "Шинэ кино нэмэх"}</h2>
          <div className="form-grid">
            {/* Үндсэн мэдээлэл */}
            <div className="form-group">
              <label>Кино нэр</label>
              <input type="text" placeholder="Кино нэр" value={form.title} onChange={e => f("title", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Төрөл</label>
              <select value={form.genre} onChange={e => f("genre", e.target.value)}>
                {["Монгол","Триллер","Тулааны","Драм","Хошин","Уран зөгнөлт","Аймшгийн","Романтик","Баримтат"].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Он</label>
              <input type="number" placeholder="2024" value={form.year} onChange={e => f("year", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Үргэлжлэх хугацаа</label>
              <input type="text" placeholder="1ц 45мин" value={form.duration} onChange={e => f("duration", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Үнэлгээ (1-10)</label>
              <input type="number" step="0.1" min="1" max="10" placeholder="8.5" value={form.rating} onChange={e => f("rating", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Онцлох кино</label>
              <label className="checkbox-label" style={{ paddingTop: 12 }}>
                <input type="checkbox" checked={form.featured} onChange={e => f("featured", e.target.checked)} />
                Нүүр хуудсанд онцлох
              </label>
            </div>
            <div className="form-group full">
              <label>Тайлбар</label>
              <textarea placeholder="Киноны тухай тайлбар..." value={form.description} onChange={e => f("description", e.target.value)} />
            </div>

            {/* Постер upload */}
            <div className="form-group full">
              <label>Постер зураг (JPG/PNG)</label>
              <FileUpload
                accept="image/*"
                label="Постер зураг"
                icon="🖼️"
                storagePath="posters"
                currentUrl={form.poster}
                onUploaded={url => f("poster", url)}
              />
              {form.poster && <img src={form.poster} alt="poster" className="poster-preview" />}
            </div>

            {/* Видео эх сурвалж сонгох */}
            <div className="form-group full">
              <label>Видео эх сурвалж</label>
              <div className="video-source-tabs">
                <button className={"vsource-tab" + (videoSource === "upload" ? " active" : "")} onClick={() => setVideoSource("upload")}>
                  📁 MP4 файл upload
                </button>
                <button className={"vsource-tab" + (videoSource === "youtube" ? " active" : "")} onClick={() => setVideoSource("youtube")}>
                  ▶ YouTube ID
                </button>
              </div>

              {videoSource === "upload" ? (
                <FileUpload
                  accept="video/mp4,video/*"
                  label="MP4 видео файл (дээд тал 2GB)"
                  icon="🎬"
                  storagePath="videos"
                  currentUrl={form.videoUrl}
                  onUploaded={url => f("videoUrl", url)}
                />
              ) : (
                <input type="text" placeholder="aqz-KE-bpKQ  (youtube.com/watch?v= дараах хэсэг)"
                  value={form.youtubeId} onChange={e => f("youtubeId", e.target.value)} />
              )}
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-save" disabled={saving} onClick={saveMovie}>
              {saving ? "Хадгалж байна..." : (editId ? "Хадгалах" : "Нэмэх")}
            </button>
            <button className="btn-cancel" onClick={() => { setShowForm(false); setEditId(null); }}>Болих</button>
          </div>
        </div>
      )}

      <div className="admin-table">
        <table>
          <thead>
            <tr><th>Постер</th><th>Нэр</th><th>Төрөл</th><th>Он</th><th>Видео</th><th>Онцлох</th><th>Үйлдэл</th></tr>
          </thead>
          <tbody>
            {movies.map(m => (
              <tr key={m.id}>
                <td><img src={m.poster} alt={m.title} /></td>
                <td style={{ fontWeight: 500 }}>{m.title}</td>
                <td><span className="genre-badge">{m.genre}</span></td>
                <td>{m.year}</td>
                <td>
                  {m.videoUrl ? <span className="video-badge">📁 MP4</span>
                    : m.youtubeId ? <span className="video-badge" style={{ background: "rgba(255,0,0,0.1)", borderColor: "rgba(255,0,0,0.3)", color: "#e74c3c" }}>▶ YouTube</span>
                    : "—"}
                </td>
                <td>{m.featured ? "✅" : "—"}</td>
                <td>
                  <button className="btn-edit" onClick={() => startEdit(m)}>Засах</button>
                  <button className="btn-delete" onClick={() => deleteMovie(m)}>Устгах</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {movies.length === 0 && <div style={{ textAlign: "center", padding: "48px", color: "var(--muted)" }}>Кино байхгүй байна.</div>}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(undefined);
  const [movies, setMovies] = useState([]);
  const [watchMovie, setWatchMovie] = useState(null);
  const [view, setView] = useState("home");

  useEffect(() => onAuthStateChanged(auth, u => setUser(u || null)), []);

  useEffect(() => {
    return onSnapshot(collection(db, "movies"), snap => {
      if (snap.empty) {
        SAMPLE_MOVIES.forEach(m => setDoc(doc(db, "movies", m.id), m));
        setMovies(SAMPLE_MOVIES);
      } else {
        setMovies(snap.docs.map(d => d.data()));
      }
    });
  }, []);

  if (user === undefined) return <><style>{styles}</style><div className="loading">Ачаалж байна...</div></>;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {!user ? <AuthScreen /> : (
          <>
            <Navbar user={user} view={view} setView={setView} />
            {view === "home" && <HomeView movies={movies} onWatch={setWatchMovie} />}
            {view === "admin" && user.email === ADMIN_EMAIL && <AdminView movies={movies} />}
            {watchMovie && <VideoModal movie={watchMovie} onClose={() => setWatchMovie(null)} />}
          </>
        )}
      </div>
    </>
  );
}

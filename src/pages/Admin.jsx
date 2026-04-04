import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection, getDocs, addDoc, deleteDoc,
  doc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { BANK_INFO, CLOUDINARY_CLOUD_NAME } from "../config/constants";
import { uploadToCloudinary } from "../services/cloudinary";
import { useWindowWidth } from "../hooks/useWindowWidth";

/* ── цэс ── */
const MENU = [
  { id:"dashboard", icon:"◈", label:"Хяналтын самбар" },
  { id:"movies",    icon:"▶", label:"Кино удирдлага" },
  { id:"upload",    icon:"⬆", label:"Кино нэмэх" },
  { id:"subs",      icon:"◉", label:"Subscription" },
  { id:"settings",  icon:"⚙", label:"Тохиргоо" },
];

/* ── нийтлэг стиль тогтмол ── */
const C = {
  cyan:   "#00e5ff",
  purple: "#7c3aed",
  green:  "#10b981",
  amber:  "#f59e0b",
  red:    "#ef4444",
  bg:     "#08091a",
  card:   "rgba(10,12,35,0.8)",
  border: "rgba(0,229,255,0.12)",
  text:   "#e0e8ff",
  muted:  "rgba(180,200,255,0.4)",
  font:   "'Rajdhani',sans-serif",
  mono:   "'Space Mono',monospace",
  orb:    "'Orbitron',sans-serif",
};

function glassCard(extra = {}) {
  return {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    backdropFilter: "blur(16px)",
    padding: 24,
    marginBottom: 20,
    ...extra,
  };
}

function cyanBtn(extra = {}) {
  return {
    background: "linear-gradient(135deg,#00e5ff,#0088aa)",
    border: "none", color: C.bg,
    padding: "11px 22px", borderRadius: 8,
    fontFamily: C.font, fontWeight: 700,
    fontSize: 13, letterSpacing: 1.5,
    textTransform: "uppercase", cursor: "pointer",
    boxShadow: "0 0 20px rgba(0,229,255,0.3)",
    transition: "all 0.2s",
    ...extra,
  };
}

function label(txt) {
  return (
    <div style={{ fontSize:10, color:"rgba(0,229,255,0.45)", letterSpacing:2,
      textTransform:"uppercase", fontFamily:C.mono, marginBottom:6, marginTop:14 }}>
      {txt}
    </div>
  );
}

function inp(props) {
  return (
    <input {...props} style={{
      padding:"11px 14px",
      background:"rgba(0,229,255,0.04)",
      border:"1px solid rgba(0,229,255,0.15)",
      borderRadius:8, color:C.text,
      fontSize:14, outline:"none",
      fontFamily:C.font, fontWeight:500,
      width:"100%", boxSizing:"border-box",
      transition:"border-color 0.2s",
      ...props.style,
    }} />
  );
}

/* ══════════════════════════════════════════════════════
   MAIN ADMIN PAGE
══════════════════════════════════════════════════════ */
export function Admin({ movies, fetchMovies, showToast }) {
  const [active, setActive] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(false);
  const w = useWindowWidth();
  const isMob = w < 768;

  /* subscription data shared across tabs */
  const [subs, setSubs] = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, "subscriptions"))
      .then(snap => setSubs(snap.docs.map(d => ({ id:d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setSubsLoading(false));
  }, []);

  const pendingCount = subs.filter(r => r.status === "pending").length;

  function navigate(id) {
    setActive(id);
    if (isMob) setSideOpen(false);
  }

  /* ── Stats ── */
  const stats = [
    { label:"Нийт кино",    value: movies.length,    color: C.cyan,   icon:"▶" },
    { label:"Хэрэглэгч",    value: subs.length,      color: C.purple, icon:"◉" },
    { label:"Идэвхтэй sub", value: subs.filter(r=>r.status==="active").length, color: C.green, icon:"✓" },
    { label:"Хүлээгдэж байна", value: pendingCount,  color: C.amber,  icon:"⏳" },
  ];

  return (
    <div style={{ display:"flex", minHeight:"calc(100vh - 72px)", background:C.bg, position:"relative" }}>

      {/* ═══ SIDEBAR ═══ */}
      {(!isMob || sideOpen) && (
        <>
          {isMob && (
            <div onClick={()=>setSideOpen(false)}
              style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:49,backdropFilter:"blur(4px)"}} />
          )}
          <aside style={{
            width: 220, flexShrink:0,
            background:"rgba(5,7,20,0.95)",
            borderRight:`1px solid ${C.border}`,
            display:"flex", flexDirection:"column",
            padding:"28px 0",
            position: isMob ? "fixed" : "sticky",
            top: isMob ? 0 : 72, left:0,
            height: isMob ? "100vh" : "calc(100vh - 72px)",
            zIndex:50, backdropFilter:"blur(20px)",
            transition:"transform 0.3s",
          }}>
            {/* Sidebar logo */}
            <div style={{ padding:"0 20px 24px", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontFamily:C.orb, fontSize:14, color:C.cyan, fontWeight:700, letterSpacing:2 }}>
                КИН<span style={{color:"#fff"}}>●</span>ТАЙМ
              </div>
              <div style={{ fontSize:10, color:"rgba(0,229,255,0.4)", letterSpacing:2, marginTop:4, fontFamily:C.mono }}>
                ADMIN PANEL
              </div>
            </div>

            {/* Menu items */}
            <nav style={{ flex:1, padding:"16px 12px", display:"flex", flexDirection:"column", gap:4 }}>
              {MENU.map(m => {
                const isActive = active === m.id;
                return (
                  <button key={m.id} onClick={() => navigate(m.id)} style={{
                    display:"flex", alignItems:"center", gap:12,
                    padding:"11px 14px", borderRadius:10,
                    background: isActive ? "rgba(0,229,255,0.1)" : "transparent",
                    border: isActive ? `1px solid rgba(0,229,255,0.3)` : "1px solid transparent",
                    color: isActive ? C.cyan : "rgba(180,200,255,0.5)",
                    cursor:"pointer", fontFamily:C.font,
                    fontWeight:700, fontSize:14, letterSpacing:1,
                    transition:"all 0.18s", textAlign:"left", width:"100%",
                    boxShadow: isActive ? "0 0 16px rgba(0,229,255,0.08)" : "none",
                    position:"relative",
                  }}>
                    <span style={{ fontSize:16, width:20, textAlign:"center", flexShrink:0 }}>{m.icon}</span>
                    {m.label}
                    {m.id === "subs" && pendingCount > 0 && (
                      <span style={{
                        marginLeft:"auto", background:C.amber,
                        color:C.bg, fontSize:10, fontWeight:700,
                        padding:"1px 7px", borderRadius:10, fontFamily:C.mono,
                      }}>{pendingCount}</span>
                    )}
                    {isActive && (
                      <span style={{
                        position:"absolute", left:0, top:"20%", bottom:"20%",
                        width:3, background:C.cyan, borderRadius:"0 2px 2px 0",
                        boxShadow:`0 0 8px ${C.cyan}`,
                      }} />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar footer */}
            <div style={{ padding:"16px 20px", borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:10, color:"rgba(0,229,255,0.25)", fontFamily:C.mono, letterSpacing:1 }}>
                KINOTIME v1.0
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <main style={{ flex:1, padding: isMob?"16px":"32px 36px", overflowX:"hidden", minWidth:0 }}>

        {/* Mobile top bar */}
        {isMob && (
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
            <button onClick={()=>setSideOpen(true)} style={{
              background:"rgba(0,229,255,0.08)", border:`1px solid ${C.border}`,
              borderRadius:8, padding:"8px 12px", cursor:"pointer",
              color:C.cyan, fontSize:18, display:"flex", alignItems:"center",
            }}>☰</button>
            <div style={{ fontFamily:C.orb, fontSize:16, color:C.cyan, fontWeight:700, letterSpacing:2 }}>
              {MENU.find(m=>m.id===active)?.label}
            </div>
          </div>
        )}

        {/* ── Dashboard ── */}
        {active === "dashboard" && (
          <DashboardTab stats={stats} movies={movies} subs={subs} isMob={isMob} />
        )}
        {/* ── Movies list ── */}
        {active === "movies" && (
          <MoviesTab movies={movies} fetchMovies={fetchMovies} showToast={showToast} isMob={isMob} />
        )}
        {/* ── Upload ── */}
        {active === "upload" && (
          <UploadTab fetchMovies={fetchMovies} showToast={showToast} isMob={isMob} />
        )}
        {/* ── Subscriptions ── */}
        {active === "subs" && (
          <SubsTab subs={subs} setSubs={setSubs} loading={subsLoading} showToast={showToast} isMob={isMob} />
        )}
        {/* ── Settings ── */}
        {active === "settings" && (
          <SettingsTab isMob={isMob} />
        )}
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   DASHBOARD TAB
══════════════════════════════════════════════════════ */
function DashboardTab({ stats, movies, subs, isMob }) {
  return (
    <div>
      <PageTitle icon="◈" title="Хяналтын самбар" sub="Бүх мэдээллийн хураангуй" />

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns: isMob?"repeat(2,1fr)":"repeat(4,1fr)", gap:14, marginBottom:28 }}>
        {stats.map(({ label, value, color, icon }) => (
          <div key={label} style={{
            ...glassCard({ marginBottom:0, padding:"20px" }),
            borderColor:`${color}22`,
          }}>
            <div style={{ fontSize:22, marginBottom:10, color }}>{icon}</div>
            <div style={{ fontFamily:C.orb, fontSize: isMob?26:32, fontWeight:700, color:"#fff", lineHeight:1 }}>{value}</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:6, fontFamily:C.mono, letterSpacing:1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Recent movies */}
      <div style={glassCard()}>
        <SectionHead icon="▶" title="Сүүлийн кинонууд" />
        {movies.slice(0, 5).map(m => (
          <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12,
            padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
            {m.poster
              ? <img src={m.poster} alt={m.title} style={{ width:36, height:48, objectFit:"cover", borderRadius:6, flexShrink:0, border:`1px solid ${C.border}` }} />
              : <div style={{ width:36, height:48, borderRadius:6, background:"rgba(0,229,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18 }}>🎬</div>
            }
            <div style={{ minWidth:0 }}>
              <div style={{ fontFamily:C.orb, fontSize:12, color:"#fff", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.title}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.description}</div>
            </div>
          </div>
        ))}
        {movies.length === 0 && <Empty text="Кино байхгүй байна" />}
      </div>

      {/* Pending subs */}
      {subs.filter(r=>r.status==="pending").length > 0 && (
        <div style={{ ...glassCard(), borderColor:"rgba(245,158,11,0.3)" }}>
          <SectionHead icon="⏳" title="Хүлээгдэж буй subscription" color={C.amber} />
          {subs.filter(r=>r.status==="pending").map(r => (
            <div key={r.id} style={{ padding:"8px 0", borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
              <span style={{ color:"#fff", fontWeight:600 }}>{r.name || r.email}</span>
              <span style={{ color:C.muted, marginLeft:8 }}>{r.email}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MOVIES TAB
══════════════════════════════════════════════════════ */
function MoviesTab({ movies, fetchMovies, showToast, isMob }) {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);

  async function deleteMovie(id) {
    if (!window.confirm("Устгах уу?")) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "movies", id));
      fetchMovies();
      showToast("Устгагдлаа.");
    } catch { showToast("Устгахад алдаа гарлаа.", "error"); }
    setDeleting(null);
  }

  const filtered = movies.filter(m =>
    m.title?.toLowerCase().includes(search.toLowerCase()) ||
    m.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageTitle icon="▶" title="Кино удирдлага" sub={`Нийт ${movies.length} кино`} />

      <div style={glassCard()}>
        {/* Search */}
        <div style={{ position:"relative", marginBottom:20 }}>
          <svg style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}
            width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(0,229,255,0.4)" strokeWidth="1.5">
            <circle cx="6" cy="6" r="4"/><path d="M9.5 9.5l3 3" strokeLinecap="round"/>
          </svg>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Кино хайх..."
            style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px 10px 36px",
              background:"rgba(0,229,255,0.04)", border:"1px solid rgba(0,229,255,0.15)",
              borderRadius:8, color:C.text, fontSize:13, outline:"none", fontFamily:C.font }} />
        </div>

        {filtered.length === 0 && <Empty text="Кино олдсонгүй" />}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(m => (
            <div key={m.id} style={{
              display:"flex", alignItems:"center", gap:14,
              background:"rgba(0,229,255,0.02)", borderRadius:12,
              padding:"12px 14px", border:`1px solid ${C.border}`,
              transition:"border-color 0.2s",
            }}>
              {m.poster
                ? <img src={m.poster} alt={m.title} style={{ width:44, height:60, objectFit:"cover", borderRadius:8, flexShrink:0, border:`1px solid ${C.border}` }} />
                : <div style={{ width:44, height:60, borderRadius:8, background:"rgba(0,229,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:22 }}>🎬</div>
              }
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:C.orb, fontWeight:700, fontSize:13, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:4 }}>{m.title}</div>
                {!isMob && <div style={{ fontSize:12, color:C.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.description}</div>}
              </div>
              <button onClick={()=>deleteMovie(m.id)} disabled={deleting===m.id}
                style={{ background:"transparent", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444",
                  padding:"6px 14px", borderRadius:7, cursor:"pointer", fontSize:12,
                  fontFamily:C.font, fontWeight:600, letterSpacing:1, whiteSpace:"nowrap",
                  opacity: deleting===m.id ? 0.5 : 1, flexShrink:0 }}>
                {deleting===m.id ? "..." : "Устгах"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   UPLOAD TAB
══════════════════════════════════════════════════════ */
function UploadTab({ fetchMovies, showToast, isMob }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [posterFile, setPosterFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [done, setDone] = useState(false);

  function handlePoster(e) {
    const f = e.target.files[0]; if (!f) return;
    setPosterFile(f);
    setPosterPreview(URL.createObjectURL(f));
  }

  async function submit(e) {
    e.preventDefault();
    if (!title || !videoFile) { showToast("Гарчиг болон видео заавал шаардлагатай!", "error"); return; }
    if (CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME") { showToast("Cloudinary тохиргоогоо оруулна уу!", "error"); return; }
    setUploading(true); setProgress(0); setDone(false);
    try {
      let posterUrl = "";
      if (posterFile) {
        setProgressLabel("Постер байршуулж байна...");
        posterUrl = await uploadToCloudinary(posterFile, setProgress);
        setProgress(0);
      }
      setProgressLabel("Видео байршуулж байна...");
      const videoUrl = await uploadToCloudinary(videoFile, setProgress);
      await addDoc(collection(db, "movies"), { title, description:desc, poster:posterUrl, videoUrl, createdAt:serverTimestamp() });
      showToast("Кино амжилттай нэмэгдлээ!");
      setTitle(""); setDesc(""); setPosterFile(null); setVideoFile(null); setPosterPreview(null);
      setDone(true); fetchMovies();
    } catch (err) { showToast("Upload алдаа: " + err.message, "error"); }
    setUploading(false); setProgress(0); setProgressLabel("");
  }

  return (
    <div>
      <PageTitle icon="⬆" title="Кино нэмэх" sub="Шинэ кино байршуулах" />

      {CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME" && (
        <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)",
          borderRadius:12, padding:"16px 20px", marginBottom:20, fontSize:13, lineHeight:1.8, color:"#fcd34d" }}>
          ⚠ <strong>Cloudinary тохиргоо хийгдээгүй байна.</strong>{" "}
          <a href="https://cloudinary.com" target="_blank" rel="noreferrer" style={{color:C.cyan}}>cloudinary.com</a>{" "}
          дээр бүртгүүлж, <code style={{background:"rgba(0,229,255,0.1)",padding:"1px 6px",borderRadius:4,fontFamily:C.mono,fontSize:11}}>config/constants.js</code> файлд оруулна уу.
        </div>
      )}

      {done && (
        <div style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)",
          borderRadius:12, padding:"16px 20px", marginBottom:20, fontSize:14, color:"#34d399",
          display:"flex", alignItems:"center", gap:10 }}>
          ✓ Кино амжилттай нэмэгдлээ!
        </div>
      )}

      <form onSubmit={submit}>
        <div style={{ display:"flex", gap:20, alignItems:"flex-start", flexWrap: isMob?"wrap":"nowrap" }}>

          {/* Left — inputs */}
          <div style={{ ...glassCard({ flex:1, minWidth:0, marginBottom:0 }) }}>
            <SectionHead icon="◈" title="Киноны мэдээлэл" />
            {label("Гарчиг *")}
            {inp({ value:title, onChange:e=>setTitle(e.target.value), placeholder:"Киноны нэр" })}
            {label("Тайлбар")}
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Товч тайлбар..."
              style={{ padding:"11px 14px", background:"rgba(0,229,255,0.04)", border:"1px solid rgba(0,229,255,0.15)",
                borderRadius:8, color:C.text, fontSize:14, outline:"none", fontFamily:C.font,
                width:"100%", boxSizing:"border-box", height:100, resize:"vertical" }} />

            {label("Постер зураг (JPG/PNG)")}
            <div style={{ background:"rgba(0,229,255,0.03)", border:"1px dashed rgba(0,229,255,0.2)", borderRadius:8,
              padding:"16px", textAlign:"center", cursor:"pointer", position:"relative" }}
              onClick={()=>document.getElementById('poster-inp').click()}>
              <input id="poster-inp" type="file" accept="image/*" onChange={handlePoster} style={{display:"none"}} />
              {posterFile
                ? <div style={{fontSize:13,color:C.cyan}}>✓ {posterFile.name}</div>
                : <div style={{fontSize:12,color:C.muted}}>Зураг сонгох дарна уу</div>
              }
            </div>

            {label("Видео файл (MP4) *")}
            <div style={{ background:"rgba(0,229,255,0.03)", border:"1px dashed rgba(0,229,255,0.2)", borderRadius:8,
              padding:"16px", textAlign:"center", cursor:"pointer" }}
              onClick={()=>document.getElementById('video-inp').click()}>
              <input id="video-inp" type="file" accept="video/*" onChange={e=>setVideoFile(e.target.files[0])} style={{display:"none"}} />
              {videoFile
                ? <div style={{fontSize:13,color:C.cyan}}>✓ {videoFile.name}</div>
                : <div style={{fontSize:12,color:C.muted}}>MP4 файл сонгох дарна уу</div>
              }
            </div>
          </div>

          {/* Right — poster preview */}
          {!isMob && (
            <div style={{ width:180, flexShrink:0 }}>
              <div style={{ ...glassCard({ padding:12, marginBottom:0 }), aspectRatio:"2/3",
                display:"flex", alignItems:"center", justifyContent:"center",
                overflow:"hidden" }}>
                {posterPreview
                  ? <img src={posterPreview} alt="preview" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:8}} />
                  : <div style={{fontSize:32,color:"rgba(0,229,255,0.15)"}}>🎬</div>
                }
              </div>
              <div style={{fontSize:10,color:C.muted,textAlign:"center",marginTop:8,fontFamily:C.mono,letterSpacing:1}}>ПОСТЕР PREVIEW</div>
            </div>
          )}
        </div>

        {/* Progress */}
        {uploading && (
          <div style={{ ...glassCard({ marginTop:16 }), padding:"20px" }}>
            <div style={{ fontSize:13, color:C.cyan, marginBottom:10, fontFamily:C.mono }}>{progressLabel}</div>
            <div style={{ background:"rgba(0,229,255,0.08)", borderRadius:50, height:6, overflow:"hidden", marginBottom:8 }}>
              <div style={{ height:"100%", background:"linear-gradient(90deg,#00e5ff,#7c3aed)",
                borderRadius:50, transition:"width 0.25s", width:`${progress}%` }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted }}>
              <span>{progress}%</span>
              <span>{progress < 100 ? "Байршуулж байна..." : "Дуусахад ойрхон..."}</span>
            </div>
          </div>
        )}

        <button type="submit" disabled={uploading} style={{
          ...cyanBtn({ marginTop:20, width:"100%", padding:"14px 24px", fontSize:14 }),
          opacity: uploading ? 0.5 : 1,
        }}>
          {uploading ? `Байршуулж байна... ${progress}%` : "⬆  Upload хийх"}
        </button>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SUBSCRIPTIONS TAB
══════════════════════════════════════════════════════ */
function SubsTab({ subs, setSubs, loading, showToast, isMob }) {
  const [filter, setFilter] = useState("all");
  const [processing, setProcessing] = useState(null);

  async function approveSub(uid) {
    setProcessing(uid);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + BANK_INFO.days);
    try {
      await updateDoc(doc(db, "subscriptions", uid), { status:"active", approvedAt:serverTimestamp(), expiresAt:expiry });
      setSubs(prev => prev.map(r => r.id===uid ? {...r, status:"active", expiresAt:expiry} : r));
      showToast("Subscription батлагдлаа!");
    } catch { showToast("Алдаа гарлаа.", "error"); }
    setProcessing(null);
  }

  async function rejectSub(uid) {
    setProcessing(uid);
    try {
      await updateDoc(doc(db, "subscriptions", uid), { status:"rejected" });
      setSubs(prev => prev.map(r => r.id===uid ? {...r, status:"rejected"} : r));
      showToast("Татгалзлаа.");
    } catch { showToast("Алдаа гарлаа.", "error"); }
    setProcessing(null);
  }

  const filters = [
    { id:"all",      label:"Бүгд",           count: subs.length },
    { id:"pending",  label:"Хүлээгдэж байна", count: subs.filter(r=>r.status==="pending").length },
    { id:"active",   label:"Идэвхтэй",        count: subs.filter(r=>r.status==="active").length },
    { id:"rejected", label:"Татгалзсан",       count: subs.filter(r=>r.status==="rejected").length },
  ];

  const displayed = filter === "all" ? subs : subs.filter(r => r.status === filter);

  const statusColor = { pending:C.amber, active:C.green, rejected:C.red, expired:"#888" };
  const statusLabel = { pending:"Хүлээгдэж байна", active:"Идэвхтэй", rejected:"Татгалзсан", expired:"Дууссан" };

  return (
    <div>
      <PageTitle icon="◉" title="Subscription удирдлага" sub={`Нийт ${subs.length} хэрэглэгч`} />

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {filters.map(f => (
          <button key={f.id} onClick={()=>setFilter(f.id)} style={{
            padding:"8px 16px", borderRadius:8, cursor:"pointer",
            fontFamily:C.font, fontWeight:700, fontSize:13, letterSpacing:1,
            border:`1px solid ${filter===f.id ? C.cyan : C.border}`,
            background: filter===f.id ? "rgba(0,229,255,0.12)" : "rgba(0,229,255,0.03)",
            color: filter===f.id ? C.cyan : C.muted,
            transition:"all 0.18s",
            display:"flex", alignItems:"center", gap:8,
          }}>
            {f.label}
            <span style={{
              background: filter===f.id ? C.cyan : "rgba(180,200,255,0.2)",
              color: filter===f.id ? C.bg : C.muted,
              fontSize:10, fontWeight:700, padding:"1px 7px", borderRadius:10, fontFamily:C.mono,
            }}>{f.count}</span>
          </button>
        ))}
      </div>

      <div style={glassCard()}>
        {loading && <Empty text="Ачааллаж байна..." />}
        {!loading && displayed.length === 0 && <Empty text="Хүсэлт байхгүй байна" />}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {displayed.map(r => {
            const sc = statusColor[r.status] || "#888";
            const sl = statusLabel[r.status] || r.status;
            const expiry = r.expiresAt instanceof Date ? r.expiresAt : r.expiresAt?.toDate?.();
            return (
              <div key={r.id} style={{
                background:"rgba(0,229,255,0.02)",
                border:`1px solid ${r.status==="pending" ? "rgba(245,158,11,0.3)" : C.border}`,
                borderRadius:12, padding:"16px 18px",
                display:"flex", gap:14, alignItems: isMob?"flex-start":"center",
                flexDirection: isMob?"column":"row",
              }}>
                {/* Avatar */}
                <div style={{
                  width:44, height:44, borderRadius:"50%", flexShrink:0,
                  background:`${sc}22`, border:`2px solid ${sc}55`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:C.orb, fontWeight:700, color:sc, fontSize:14,
                }}>
                  {(r.name||r.email||"?").slice(0,2).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                    <span style={{ fontFamily:C.font, fontWeight:700, fontSize:15, color:"#fff" }}>
                      {r.name || r.email?.split("@")[0]}
                    </span>
                    <span style={{
                      fontSize:10, fontWeight:700, letterSpacing:1.5,
                      padding:"2px 8px", borderRadius:4, textTransform:"uppercase", fontFamily:C.mono,
                      background:`${sc}18`, color:sc,
                    }}>{sl}</span>
                  </div>
                  <div style={{ fontSize:12, color:C.muted, marginBottom: r.note?4:0 }}>{r.email}</div>
                  {r.note && (
                    <div style={{ fontSize:12, color:"rgba(180,200,255,0.6)",
                      background:"rgba(0,0,0,0.3)", borderRadius:6,
                      padding:"6px 10px", marginTop:4, borderLeft:`2px solid ${C.cyan}44` }}>
                      💬 {r.note}
                    </div>
                  )}
                  {r.status==="active" && expiry && (
                    <div style={{ fontSize:11, color:C.green, marginTop:6, fontFamily:C.mono }}>
                      ✓ Дуусах огноо: {expiry.toLocaleDateString("mn-MN")}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {r.status === "pending" && (
                  <div style={{ display:"flex", gap:8, flexShrink:0, flexWrap:"wrap" }}>
                    <button onClick={()=>approveSub(r.id)} disabled={processing===r.id} style={{
                      background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.4)",
                      color:C.green, padding:"8px 18px", borderRadius:8,
                      cursor:"pointer", fontSize:13, fontFamily:C.font,
                      fontWeight:700, letterSpacing:1, transition:"all 0.2s",
                      opacity:processing===r.id?0.5:1,
                    }}>
                      {processing===r.id?"...":"✓ Батлах"}
                    </button>
                    <button onClick={()=>rejectSub(r.id)} disabled={processing===r.id} style={{
                      background:"transparent", border:"1px solid rgba(239,68,68,0.3)",
                      color:C.red, padding:"8px 16px", borderRadius:8,
                      cursor:"pointer", fontSize:13, fontFamily:C.font,
                      fontWeight:700, letterSpacing:1, transition:"all 0.2s",
                      opacity:processing===r.id?0.5:1,
                    }}>
                      ✕ Татгалзах
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SETTINGS TAB
══════════════════════════════════════════════════════ */
function SettingsTab({ isMob }) {
  return (
    <div>
      <PageTitle icon="⚙" title="Тохиргоо" sub="Системийн тохиргоо" />
      <div style={glassCard()}>
        <SectionHead icon="◈" title="Дансны мэдээлэл" />
        {[
          { label:"Банк",           value: BANK_INFO.bank },
          { label:"Дансны нэр",     value: BANK_INFO.name },
          { label:"Дансны дугаар",  value: BANK_INFO.account },
          { label:"Subscription үнэ", value: BANK_INFO.currency + BANK_INFO.price },
          { label:"Хугацаа",        value: BANK_INFO.days + " хоног" },
        ].map(({ label: l, value }) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
            <span style={{ fontSize:13, color:C.muted, fontFamily:C.mono, letterSpacing:1 }}>{l}</span>
            <span style={{ fontSize:14, color:"#fff", fontWeight:600, fontFamily:C.font }}>{value}</span>
          </div>
        ))}
        <div style={{ marginTop:16, fontSize:12, color:C.muted, lineHeight:1.7 }}>
          Эдгээр утгыг өөрчлөхийн тулд{" "}
          <code style={{ background:"rgba(0,229,255,0.08)", padding:"1px 6px", borderRadius:4, fontFamily:C.mono, fontSize:11, color:C.cyan }}>
            src/config/constants.js
          </code>
          {" "}файлыг засна уу.
        </div>
      </div>

      <div style={glassCard()}>
        <SectionHead icon="☁" title="Cloudinary тохиргоо" />
        <div style={{ fontSize:13, color:C.muted, lineHeight:1.8 }}>
          {CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME" ? (
            <div style={{ color:C.amber }}>
              ⚠ Cloudinary тохируулагдаагүй байна.{" "}
              <a href="https://cloudinary.com" target="_blank" rel="noreferrer" style={{ color:C.cyan }}>
                cloudinary.com
              </a>{" "}
              дээр бүртгүүлж,{" "}
              <code style={{ background:"rgba(0,229,255,0.08)", padding:"1px 6px", borderRadius:4, fontFamily:C.mono, fontSize:11, color:C.cyan }}>constants.js</code>
              {" "}файлд оруулна уу.
            </div>
          ) : (
            <div style={{ color:C.green }}>
              ✓ Cloudinary тохируулагдсан байна. Cloud: <strong style={{color:"#fff"}}>{CLOUDINARY_CLOUD_NAME}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SHARED UI COMPONENTS
══════════════════════════════════════════════════════ */
function PageTitle({ icon, title, sub }) {
  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
        <span style={{ color:C.cyan, fontSize:20 }}>{icon}</span>
        <h2 style={{ fontFamily:C.orb, fontSize:20, fontWeight:700, color:"#fff",
          margin:0, letterSpacing:2, textTransform:"uppercase" }}>{title}</h2>
      </div>
      {sub && <div style={{ fontSize:12, color:C.muted, fontFamily:C.mono, letterSpacing:1, paddingLeft:30 }}>{sub}</div>}
      <div style={{ height:1, background:`linear-gradient(90deg,${C.cyan}44,transparent)`, marginTop:16 }} />
    </div>
  );
}

function SectionHead({ icon, title, color = C.cyan }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
      <span style={{ color, fontSize:14 }}>{icon}</span>
      <span style={{ fontFamily:C.mono, fontSize:11, fontWeight:700, color:"rgba(180,200,255,0.5)", letterSpacing:2, textTransform:"uppercase" }}>{title}</span>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ textAlign:"center", padding:"32px 0", color:C.muted, fontSize:13, fontFamily:C.mono, letterSpacing:1 }}>
      {text}
    </div>
  );
}

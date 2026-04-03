import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { s } from "../styles/theme";
import { useWindowWidth } from "../hooks/useWindowWidth";
import { MovieCard } from "../components/MovieCard";
import { fetchLikeCounts, fetchUserLikedIds } from "../services/likeService";

export function Home({ movies, user, setPage, openWatch, subStatus }) {
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
    setLikedIds(prev => liked ? prev.filter(id=>id!==movieId) : [...prev, movieId]);
    setLikeCounts(prev => ({...prev, [movieId]: (prev[movieId]||0) + (liked ? -1 : 1)}));
    try {
      const { toggleLike: tl } = await import("../services/likeService");
      await tl(user, movieId, liked);
    } catch (err) {
      console.error("Like алдаа:", err.message);
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

  const w = useWindowWidth();
  const isMob = w < 640;
  const isTab = w < 960;
  const px = isMob ? "16px" : isTab ? "24px" : "40px";
  const heroH = isMob ? 340 : isTab ? 420 : 520;
  const heroTitleSize = isMob ? 32 : isTab ? 44 : 54;
  const gridCols = isMob ? "repeat(2,1fr)" : isTab ? "repeat(3,1fr)" : "repeat(auto-fill,minmax(200px,1fr))";

  return (
    <div style={s.page} className="kt-page-bg">
      {/* ── Hero ── */}
      {tab === "home" && hero && (
        <div style={{...s.hero, height:heroH, backgroundImage:`url(${hero.poster})`}}>
          <div style={s.heroOverlay}>
            <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,229,255,0.015) 2px,rgba(0,229,255,0.015) 4px)",pointerEvents:"none"}} />
          </div>
          <div style={{...s.heroOverlay, padding:`0 ${px}`}}>
            <div style={s.heroTag} className="kt-hero-reveal">Шинэ кино</div>
            <h1 style={{...s.heroTitle, fontSize:heroTitleSize}} className="kt-hero-title">{hero.title}</h1>
            {!isMob && <p style={s.heroDesc} className="kt-hero-desc">{hero.description}</p>}
            <div style={{display:"flex", gap:10, alignItems:"center", flexWrap:"wrap"}} className="kt-hero-btns">
              <button style={{...s.heroBtn, padding: isMob?"11px 24px":"13px 36px", fontSize:isMob?13:14}} className="kt-btn-pulse" onClick={() => {
                if(!user){ setPage("login"); return; }
                if(subStatus !== "active"){ setPage("subscribe"); return; }
                openWatch(hero);
              }}>▶ {isMob?"Үзэх":"  Үзэх"}</button>
              <button onClick={(e) => toggleLike(e, hero.id)} style={{
                background: likedIds.includes(hero.id) ? "rgba(0,229,255,0.25)" : "rgba(0,229,255,0.06)",
                border: "1.5px solid " + (likedIds.includes(hero.id) ? "#00e5ff" : "rgba(0,229,255,0.25)"),
                color: likedIds.includes(hero.id) ? "#00e5ff" : "rgba(0,229,255,0.7)",
                padding: isMob?"10px 14px":"13px 20px", borderRadius:8, cursor:"pointer",
                fontSize:16, display:"flex", alignItems:"center", gap:6,
                fontFamily:"'Rajdhani',sans-serif", fontWeight:600, transition:"all 0.2s",
              }}>
                {likedIds.includes(hero.id) ? "♥" : "♡"}
                <span style={{fontSize:13}}>{likeCounts[hero.id] || 0}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {tab === "home" && movies.length === 0 && (
        <div style={s.emptyHero}>
          <div style={{...s.splashLogo, fontSize: isMob?36:56}}>КИН<span style={{color:"#00e5ff",textShadow:"0 0 20px #00e5ff"}}>●</span>ТАЙМ</div>
          <p style={{color:"#555",marginTop:16}}>Удахгүй кинонууд нэмэгдэнэ...</p>
        </div>
      )}

      {/* ── Tab bar ── */}
      <div style={{...s.tabBar, padding:`0 ${px}`, flexWrap: isMob?"wrap":"nowrap", gap: isMob?0:0, position:"relative"}}>
        <div className="kt-tabbar-line" style={{position:"absolute",bottom:0,left:0,right:0,height:1}} />
        <div style={{...s.tabInner, flex:1, overflowX:"auto"}}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSearch(""); }}
              style={{...s.tabBtn, padding: isMob?"14px 14px":"16px 24px", fontSize:isMob?12:13, whiteSpace:"nowrap"}}
              className={tab === t.id ? "kt-tab-active" : ""}
            >
              {t.label}
              {t.id === "liked" && likedIds.length > 0 && (
                <span style={{marginLeft:5,background:"#7c3aed",color:"#fff",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:10}}>{likedIds.length}</span>
              )}
            </button>
          ))}
        </div>
        {tab === "home" && !isMob && (
          <div className="kt-search-wrap" style={{position:"relative",flexShrink:0}}>
            <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(0,229,255,0.5)" strokeWidth="1.5"><circle cx="6" cy="6" r="4"/><path d="M9.5 9.5l3 3" strokeLinecap="round"/></svg>
            <input style={{...s.tabSearch, paddingLeft:34}} placeholder="Хайх..." value={search} onChange={(e)=>setSearch(e.target.value)} />
          </div>
        )}
        {/* Mobile search — full row */}
        {tab === "home" && isMob && (
          <div style={{width:"100%", padding:"8px 0 10px", position:"relative"}}>
            <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="rgba(0,229,255,0.5)" strokeWidth="1.5"><circle cx="6" cy="6" r="4"/><path d="M9.5 9.5l3 3" strokeLinecap="round"/></svg>
            <input style={{...s.tabSearch, width:"100%", paddingLeft:34, boxSizing:"border-box"}} placeholder="Кино хайх..." value={search} onChange={(e)=>setSearch(e.target.value)} />
          </div>
        )}
      </div>

      {/* ── Content grid ── */}
      <div style={{...s.gridWrap, padding:`24px ${px} 60px`}}>
        {tab === "home" && (
          <>
            <h2 style={{...s.sectionTitle, fontSize:isMob?14:18}}><span style={{display:"inline-block",width:3,height:16,background:"#00e5ff",borderRadius:2,marginRight:8,verticalAlign:"middle",boxShadow:"0 0 8px #00e5ff"}} />Бүх кино</h2>
            {filtered.length === 0 && <p style={{color:"#555",textAlign:"center",marginTop:40}}>Кино олдсонгүй</p>}
            <div style={{...s.grid, gridTemplateColumns:gridCols, gap:isMob?12:18}}>
              {filtered.map((m) => (
                <MovieCard key={m.id} movie={m} user={user} setPage={setPage} openWatch={openWatch}
                  liked={likedIds.includes(m.id)} likeCount={likeCounts[m.id]||0} onLike={toggleLike} isMob={isMob} />
              ))}
            </div>
          </>
        )}
        {tab === "featured" && (
          <>
            <h2 style={{...s.sectionTitle, fontSize:isMob?14:18}}><span style={{display:"inline-block",width:3,height:16,background:"#7c3aed",borderRadius:2,marginRight:8,verticalAlign:"middle",boxShadow:"0 0 8px #7c3aed"}} />Онцлох кино</h2>
            <div style={{...s.grid, gridTemplateColumns:gridCols, gap:isMob?12:18}}>
              {featuredMovies.map((m) => (
                <MovieCard key={m.id} movie={m} user={user} setPage={setPage} openWatch={openWatch}
                  liked={likedIds.includes(m.id)} likeCount={likeCounts[m.id]||0} onLike={toggleLike} featured isMob={isMob} />
              ))}
            </div>
          </>
        )}
        {tab === "liked" && (
          <>
            <h2 style={{...s.sectionTitle, fontSize:isMob?14:18}}><span style={{display:"inline-block",width:3,height:16,background:"#ff6b6b",borderRadius:2,marginRight:8,verticalAlign:"middle",boxShadow:"0 0 8px #ff6b6b"}} />Таалагдсан кино</h2>
            {!user && <p style={{color:"#555",textAlign:"center",marginTop:40}}>Нэвтэрч орсны дараа харагдана</p>}
            {user && likedMovies.length === 0 && (
              <div style={{textAlign:"center",marginTop:60,color:"#555"}}>
                <div style={{fontSize:42,marginBottom:14}}>♡</div>
                <div style={{fontSize:15,color:"rgba(180,200,255,0.4)"}}>Таалагдсан кино байхгүй байна</div>
                <div style={{fontSize:13,marginTop:6,color:"rgba(0,229,255,0.3)"}}>Кино карт дээрх ♡ товч дарж нэмнэ</div>
              </div>
            )}
            <div style={{...s.grid, gridTemplateColumns:gridCols, gap:isMob?12:18}}>
              {likedMovies.map((m) => (
                <MovieCard key={m.id} movie={m} user={user} setPage={setPage} openWatch={openWatch}
                  liked={true} likeCount={likeCounts[m.id]||0} onLike={toggleLike} isMob={isMob} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


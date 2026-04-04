import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useWindowWidth } from "../hooks/useWindowWidth";

const C = {
  bg:"#08091a", cyan:"#00e5ff", purple:"#7c3aed",
  red:"#ef4444", green:"#10b981", amber:"#f59e0b",
  text:"#e0e8ff", muted:"rgba(180,200,255,0.5)",
  font:"'Rajdhani',sans-serif", orb:"'Orbitron',sans-serif", mono:"'Space Mono',monospace",
};

export function Home({ movies, user, setPage, openWatch, subStatus }) {
  const [likedIds,   setLikedIds]   = useState([]);
  const [likeCounts, setLikeCounts] = useState({});
  const [search,     setSearch]     = useState("");
  const [heroIdx,    setHeroIdx]    = useState(0);
  const w = useWindowWidth();
  const isMob = w < 640;

  useEffect(() => {
    if (!movies.length) return;
    Promise.all(movies.map(async m => {
      try {
        const snap = await getDoc(doc(db, "likes", m.id));
        return [m.id, snap.exists() ? (snap.data().users||[]).length : 0];
      } catch { return [m.id, 0]; }
    })).then(pairs => setLikeCounts(Object.fromEntries(pairs)));
  }, [movies]);

  useEffect(() => {
    if (!user) { setLikedIds([]); return; }
    getDoc(doc(db, "userLikes", user.uid))
      .then(snap => setLikedIds(snap.exists() ? snap.data().movies||[] : []))
      .catch(() => setLikedIds([]));
  }, [user]);

  useEffect(() => {
    if (movies.length < 2) return;
    const t = setInterval(() => setHeroIdx(i => (i+1) % Math.min(movies.length, 5)), 8000);
    return () => clearInterval(t);
  }, [movies.length]);

  async function toggleLike(e, movieId) {
    e.stopPropagation();
    if (!user) { setPage("login"); return; }
    const liked = likedIds.includes(movieId);
    setLikedIds(prev => liked ? prev.filter(id=>id!==movieId) : [...prev, movieId]);
    setLikeCounts(prev => ({...prev, [movieId]: (prev[movieId]||0)+(liked?-1:1)}));
    try {
      const lr = doc(db,"likes",movieId), ls = await getDoc(lr);
      if (!ls.exists()) await setDoc(lr,{users:liked?[]:[user.uid]});
      else await updateDoc(lr,{users:liked?arrayRemove(user.uid):arrayUnion(user.uid)});
      const ur = doc(db,"userLikes",user.uid), us = await getDoc(ur);
      if (!us.exists()) await setDoc(ur,{movies:liked?[]:[movieId]});
      else await updateDoc(ur,{movies:liked?arrayRemove(movieId):arrayUnion(movieId)});
    } catch {
      setLikedIds(prev => liked?[...prev,movieId]:prev.filter(id=>id!==movieId));
      setLikeCounts(prev => ({...prev,[movieId]:(prev[movieId]||0)+(liked?1:-1)}));
    }
  }

  function handleWatch(movie) {
    if (!user)                  { setPage("login");     return; }
    if (subStatus !== "active") { setPage("subscribe"); return; }
    openWatch(movie);
  }

  const searchResults = search.trim()
    ? movies.filter(m => m.title?.toLowerCase().includes(search.toLowerCase()) || m.description?.toLowerCase().includes(search.toLowerCase()))
    : [];

  const hero     = movies[heroIdx] || movies[0];
  const trending = movies.slice(0, 10);
  const topRated = [...movies].sort((a,b)=>(b.likeCount||0)-(a.likeCount||0)).slice(0,10);
  const newest   = [...movies].slice(0,10);
  const likedMs  = movies.filter(m=>likedIds.includes(m.id));

  const rows = [
    {id:"trending",label:"🔥 Trending",    movies:trending, color:C.amber},
    {id:"top",     label:"⭐ Top Rated",    movies:topRated, color:C.cyan},
    {id:"new",     label:"🆕 Шинэ кино",   movies:newest,   color:C.green},
    ...(likedMs.length?[{id:"liked",label:"♥ Таалагдсан",movies:likedMs,color:"#ff6b6b"}]:[]),
  ];

  if (!movies.length) return <EmptyState isMob={isMob} />;

  return (
    <div style={{background:C.bg,minHeight:"100vh"}}>
      <style>{homeCss}</style>

      <HeroSection
        movie={hero} heroIdx={heroIdx} setHeroIdx={setHeroIdx}
        heroMovies={movies.slice(0,5)}
        liked={likedIds.includes(hero?.id)} likeCount={likeCounts[hero?.id]||0}
        onLike={toggleLike} onWatch={handleWatch}
        search={search} onSearch={setSearch}
        isMob={isMob}
      />

      <div style={{paddingBottom:60}}>
        {search.trim() ? (
          <section style={{padding:isMob?"20px 16px":"28px 48px"}}>
            <RowTitle label={`🔍 "${search}" — ${searchResults.length} кино`} color={C.cyan} />
            <div style={{marginTop:14}}>
              {searchResults.length===0
                ? <div style={{color:C.muted,fontSize:14,fontFamily:C.font,padding:"16px 0"}}>Олдсонгүй</div>
                : <HorizRow movies={searchResults} likedIds={likedIds} likeCounts={likeCounts} onLike={toggleLike} onWatch={handleWatch} isMob={isMob} />
              }
            </div>
          </section>
        ) : rows.map(row => row.movies.length > 0 && (
          <section key={row.id} style={{marginBottom:isMob?28:36}}>
            <div style={{padding:isMob?"0 16px 12px":"0 48px 14px"}}>
              <RowTitle label={row.label} color={row.color} />
            </div>
            <HorizRow movies={row.movies} likedIds={likedIds} likeCounts={likeCounts} onLike={toggleLike} onWatch={handleWatch} isMob={isMob} />
          </section>
        ))}
      </div>
    </div>
  );
}

/* ── Hero ── */
function HeroSection({movie,heroIdx,setHeroIdx,heroMovies,liked,likeCount,onLike,onWatch,search,onSearch,isMob}) {
  if (!movie) return null;
  const H = isMob ? 380 : 620;
  return (
    <div style={{position:"relative",height:H,overflow:"hidden"}}>
      <div key={movie.id} className="kt-hero-bg" style={{position:"absolute",inset:0,backgroundImage:`url(${movie.poster})`,backgroundSize:"cover",backgroundPosition:"center top"}} />
      <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,229,255,0.012) 3px,rgba(0,229,255,0.012) 4px)",pointerEvents:"none",zIndex:1}} />
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(8,9,26,0.96) 0%,rgba(8,9,26,0.55) 55%,rgba(8,9,26,0.05) 100%)",zIndex:2}} />
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"55%",background:"linear-gradient(to top,#08091a 0%,transparent 100%)",zIndex:2}} />

      <div style={{position:"absolute",inset:0,zIndex:3,display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:isMob?"24px 20px 28px":"0 64px 44px"}}>
        {!isMob && (
          <div style={{position:"absolute",top:28,right:48,width:260}}>
            <SearchBar value={search} onChange={onSearch} />
          </div>
        )}

        <div className="kt-hero-reveal" style={{display:"inline-flex",alignItems:"center",gap:6,background:"linear-gradient(90deg,rgba(0,229,255,0.15),rgba(124,58,237,0.15))",border:"1px solid rgba(0,229,255,0.35)",borderRadius:4,padding:"4px 12px",width:"fit-content",marginBottom:12}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:"#00e5ff",boxShadow:"0 0 8px #00e5ff",flexShrink:0}} />
          <span style={{fontFamily:C.mono,fontSize:9,color:"#00e5ff",letterSpacing:2.5,textTransform:"uppercase"}}>Онцлох кино</span>
        </div>

        <h1 className="kt-hero-title" style={{fontFamily:C.orb,fontWeight:900,fontSize:isMob?28:58,letterSpacing:1,color:"#fff",margin:"0 0 10px",lineHeight:1.05,maxWidth:580,textShadow:"0 4px 32px rgba(0,0,0,0.8)"}}>
          {movie.title}
        </h1>

        {!isMob && (
          <p className="kt-hero-desc" style={{fontSize:15,color:"rgba(200,215,255,0.72)",maxWidth:460,marginBottom:24,lineHeight:1.75,fontFamily:C.font,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
            {movie.description}
          </p>
        )}
        {isMob && <div style={{marginBottom:16}} />}

        <div className="kt-hero-btns" style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={()=>onWatch(movie)} className="kt-play-btn" style={{display:"flex",alignItems:"center",gap:10,background:"linear-gradient(135deg,#00e5ff,#0088bb)",border:"none",borderRadius:8,padding:isMob?"10px 20px":"13px 30px",color:"#08091a",fontFamily:C.font,fontWeight:800,fontSize:isMob?13:15,letterSpacing:1.5,cursor:"pointer",textTransform:"uppercase",boxShadow:"0 0 28px rgba(0,229,255,0.5)"}}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="#08091a"><polygon points="2,1 14,7.5 2,14"/></svg>
            Үзэх
          </button>

          <button style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,padding:isMob?"10px 16px":"13px 24px",color:"#fff",fontFamily:C.font,fontWeight:700,fontSize:isMob?13:14,letterSpacing:1,cursor:"pointer",backdropFilter:"blur(8px)",textTransform:"uppercase",transition:"all 0.2s"}}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="6.5" cy="6.5" r="5.5"/><polygon points="5,4 10,6.5 5,9" fill="currentColor" stroke="none"/></svg>
            Trailer
          </button>

          <button onClick={e=>onLike(e,movie.id)} style={{display:"flex",alignItems:"center",gap:5,background:liked?"rgba(0,229,255,0.2)":"rgba(0,0,0,0.35)",border:`1.5px solid ${liked?"#00e5ff":"rgba(255,255,255,0.2)"}`,borderRadius:8,padding:isMob?"10px 12px":"13px 16px",color:liked?"#00e5ff":"rgba(255,255,255,0.7)",fontSize:17,cursor:"pointer",backdropFilter:"blur(8px)",transition:"all 0.2s"}}>
            {liked?"♥":"♡"}
            {likeCount>0 && <span style={{fontSize:12,fontFamily:C.font,fontWeight:600}}>{likeCount}</span>}
          </button>
        </div>

        {isMob && <div style={{marginTop:14}}><SearchBar value={search} onChange={onSearch} /></div>}

        {heroMovies.length>1 && (
          <div style={{display:"flex",gap:6,marginTop:20,alignItems:"center"}}>
            {heroMovies.map((_,i)=>(
              <button key={i} onClick={()=>setHeroIdx(i)} style={{width:i===heroIdx?24:6,height:6,borderRadius:3,background:i===heroIdx?"#00e5ff":"rgba(255,255,255,0.25)",border:"none",cursor:"pointer",padding:0,transition:"all 0.4s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:i===heroIdx?"0 0 8px #00e5ff":"none"}} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Horizontal Row ── */
function HorizRow({movies,likedIds,likeCounts,onLike,onWatch,isMob}) {
  const rowRef = useRef(null);
  const [canL,setCanL]=useState(false);
  const [canR,setCanR]=useState(true);
  function check(){const el=rowRef.current;if(!el)return;setCanL(el.scrollLeft>8);setCanR(el.scrollLeft<el.scrollWidth-el.clientWidth-8);}
  function scroll(d){const el=rowRef.current;if(!el)return;el.scrollBy({left:d==="r"?el.clientWidth*0.75:-el.clientWidth*0.75,behavior:"smooth"});}
  const cw = isMob?130:175;
  const px = isMob?16:48;
  return (
    <div style={{position:"relative"}}>
      {canL&&!isMob&&<button onClick={()=>scroll("l")} className="kt-arrow kt-arrow-l"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4L6 9l5 5"/></svg></button>}
      <div ref={rowRef} onScroll={check} style={{display:"flex",gap:isMob?10:14,overflowX:"auto",overflowY:"visible",scrollbarWidth:"none",padding:`4px ${px}px 16px`,scrollSnapType:"x mandatory"}}>
        {movies.map((m,i)=>(
          <NetflixCard key={m.id} movie={m} idx={i} cardW={cw} liked={likedIds.includes(m.id)} likeCount={likeCounts[m.id]||0} onLike={onLike} onWatch={onWatch} isMob={isMob} />
        ))}
      </div>
      {canR&&!isMob&&<button onClick={()=>scroll("r")} className="kt-arrow kt-arrow-r"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 4l5 5-5 5"/></svg></button>}
    </div>
  );
}

/* ── Netflix Card ── */
function NetflixCard({movie,idx,cardW,liked,likeCount,onLike,onWatch,isMob}) {
  const [hov,setHov]=useState(false);
  return (
    <div className="kt-nfc" style={{width:cardW,flexShrink:0,scrollSnapAlign:"start",animationDelay:`${idx*0.05}s`,position:"relative",zIndex:hov?10:1}}
      onMouseEnter={()=>!isMob&&setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div style={{width:"100%",aspectRatio:"2/3",borderRadius:10,overflow:"hidden",position:"relative",cursor:"pointer",
        transition:"transform 0.35s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.35s",
        transform:hov?"scale(1.12) translateY(-8px)":"scale(1)",
        boxShadow:hov?"0 24px 60px rgba(0,0,0,0.8),0 0 0 1.5px rgba(0,229,255,0.5),-4px -4px 20px rgba(0,229,255,0.1)":"0 6px 20px rgba(0,0,0,0.5)"}}
        onClick={()=>onWatch(movie)}>
        {movie.poster
          ? <img src={movie.poster} alt={movie.title} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} />
          : <div style={{width:"100%",height:"100%",background:"rgba(0,229,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>🎬</div>
        }
        {/* Hover overlay */}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(8,9,26,0.95) 0%,rgba(8,9,26,0.3) 55%,transparent 100%)",opacity:hov?1:0,transition:"opacity 0.25s",display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"12px 10px"}}>
          <button onClick={e=>{e.stopPropagation();onWatch(movie);}} style={{background:"rgba(0,229,255,0.9)",border:"none",borderRadius:"50%",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:8,boxShadow:"0 0 16px rgba(0,229,255,0.6)"}}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="#08091a"><polygon points="2,1 12,6.5 2,12"/></svg>
          </button>
          <button onClick={e=>{e.stopPropagation();onLike(e,movie.id);}} style={{background:liked?"rgba(0,229,255,0.25)":"rgba(0,0,0,0.5)",border:`1px solid ${liked?"#00e5ff":"rgba(255,255,255,0.3)"}`,borderRadius:6,padding:"4px 8px",color:liked?"#00e5ff":"#fff",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:C.font,fontWeight:600,width:"fit-content"}}>
            {liked?"♥":"♡"}{likeCount>0&&" "+likeCount}
          </button>
        </div>
        {/* Top cyan line */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#00e5ff,transparent)",opacity:hov?1:0,transition:"opacity 0.25s"}} />
      </div>
      {/* Title */}
      <div style={{marginTop:8,paddingLeft:2,opacity:hov?1:0.65,transition:"opacity 0.25s"}}>
        <div style={{fontFamily:C.orb,fontSize:isMob?10:11,fontWeight:700,color:"#fff",letterSpacing:0.5,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{movie.title}</div>
        {hov&&<div style={{fontSize:10,color:C.muted,marginTop:3,fontFamily:C.font,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{movie.description}</div>}
      </div>
    </div>
  );
}

/* ── Search Bar ── */
function SearchBar({value,onChange}) {
  return (
    <div style={{position:"relative"}}>
      <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(0,229,255,0.5)" strokeWidth="1.5">
        <circle cx="6" cy="6" r="4"/><path d="M9.5 9.5l3 3" strokeLinecap="round"/>
      </svg>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder="Кино хайх..."
        style={{width:"100%",boxSizing:"border-box",padding:"10px 36px 10px 36px",background:"rgba(8,9,26,0.75)",border:"1px solid rgba(0,229,255,0.25)",borderRadius:30,color:"#e0e8ff",fontSize:13,outline:"none",fontFamily:C.font,letterSpacing:0.5,backdropFilter:"blur(12px)",transition:"border-color 0.2s"}}
        onFocus={e=>e.target.style.borderColor="rgba(0,229,255,0.6)"}
        onBlur={e=>e.target.style.borderColor="rgba(0,229,255,0.25)"} />
      {value&&<button onClick={()=>onChange("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"rgba(0,229,255,0.5)",cursor:"pointer",fontSize:15,lineHeight:1}}>✕</button>}
    </div>
  );
}

/* ── Row Title ── */
function RowTitle({label,color}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:3,height:20,background:color,borderRadius:2,boxShadow:`0 0 8px ${color}`,flexShrink:0}} />
      <span style={{fontFamily:C.orb,fontSize:15,fontWeight:700,color:"#fff",letterSpacing:2,textTransform:"uppercase"}}>{label}</span>
    </div>
  );
}

/* ── Empty State ── */
function EmptyState({isMob}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh",background:C.bg,padding:24,textAlign:"center"}}>
      <div style={{fontFamily:C.orb,fontSize:isMob?40:64,fontWeight:900,color:"#fff",textShadow:"0 0 40px rgba(0,229,255,0.4)",marginBottom:16}}>
        КИН<span style={{color:"#00e5ff"}}>●</span>ТАЙМ
      </div>
      <div style={{fontSize:14,color:C.muted,fontFamily:C.mono,letterSpacing:2}}>УДАХГҮЙ КИНОНУУД НЭМЭГДЭНЭ...</div>
    </div>
  );
}

/* ── CSS ── */
const homeCss = `
  @keyframes ktKenBurns { from{transform:scale(1.08)} to{transform:scale(1)} }
  .kt-hero-bg { animation: ktKenBurns 8s ease-out forwards; transform-origin:center center; }

  @keyframes ktSlideIn { from{opacity:0;transform:translateX(-28px)} to{opacity:1;transform:translateX(0)} }
  .kt-hero-reveal { animation: ktSlideIn 0.9s cubic-bezier(0.16,1,0.3,1) both; }
  .kt-hero-title  { animation: ktSlideIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s both; }
  .kt-hero-desc   { animation: ktSlideIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.28s both; }
  .kt-hero-btns   { animation: ktSlideIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.40s both; }

  @keyframes ktPlayPulse { 0%,100%{box-shadow:0 0 0 0 rgba(0,229,255,0.5),0 0 28px rgba(0,229,255,0.4)} 50%{box-shadow:0 0 0 8px rgba(0,229,255,0),0 0 40px rgba(0,229,255,0.7)} }
  .kt-play-btn { animation: ktPlayPulse 2s infinite; }
  .kt-play-btn:hover { opacity:0.9; }

  @keyframes ktCardIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  .kt-nfc { animation: ktCardIn 0.45s cubic-bezier(0.16,1,0.3,1) both; }

  .kt-arrow {
    position:absolute; top:0; bottom:16px; width:52px;
    background:linear-gradient(to right,rgba(8,9,26,0.97),rgba(8,9,26,0.5));
    border:none; color:rgba(0,229,255,0.75); cursor:pointer; z-index:5;
    display:flex; align-items:center; justify-content:center;
    transition:color 0.2s,background 0.2s;
  }
  .kt-arrow:hover { color:#00e5ff; }
  .kt-arrow-l { left:0; border-radius:0 8px 8px 0; }
  .kt-arrow-r { right:0; border-radius:8px 0 0 8px; background:linear-gradient(to left,rgba(8,9,26,0.97),rgba(8,9,26,0.5)); }
  .kt-arrow-r:hover { background:linear-gradient(to left,rgba(8,9,26,0.99),rgba(8,9,26,0.7)); }

  div::-webkit-scrollbar { display:none; }
  input::placeholder { color:rgba(0,229,255,0.28); }

  @media(max-width:639px) {
    .kt-arrow { display:none; }
    .kt-play-btn { animation:none; }
  }
`;

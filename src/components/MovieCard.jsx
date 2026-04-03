import React from "react";
import { s } from "../styles/theme";

export function MovieCard({ movie, user, setPage, openWatch, liked, likeCount, onLike, featured, isMob }) {
  return (
    <div
      className="kt-card-3d kt-fade-in kt-shine"
      style={{ ...s.card, outline: featured ? "1.5px solid rgba(124,58,237,0.6)" : "none" }}
      onClick={() => { if (!user) { setPage("login"); return; } openWatch(movie); }}
    >
      <div style={{position:"relative"}}>
        {movie.poster
          ? <img src={movie.poster} alt={movie.title} style={s.cardImg} />
          : <div style={s.cardNoImg}>🎬</div>}
        {featured && (
          <div style={{position:"absolute",top:8,left:8,background:"linear-gradient(135deg,#7c3aed,#5b21b6)",color:"#fff",fontSize:9,fontWeight:700,letterSpacing:1.5,padding:"3px 8px",borderRadius:4,textTransform:"uppercase"}}>Онцлох</div>
        )}
        <button onClick={(e) => onLike(e, movie.id)} style={{
          position:"absolute",top:8,right:8,
          background: liked ? "rgba(0,229,255,0.85)" : "rgba(8,9,26,0.75)",
          border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:16, color: liked ? "#08091a" : "rgba(0,229,255,0.8)",
          transition:"all 0.2s", backdropFilter:"blur(4px)",
        }}>
          {liked ? "♥" : "♡"}
        </button>
      </div>
      <div style={s.cardBody}>
        <div style={s.cardTitle}>{movie.title}</div>
        {!isMob && <div style={s.cardDesc}>{movie.description}</div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:isMob?4:8}}>
          <div style={s.cardPlay}>▶ Үзэх</div>
          {likeCount > 0 && (
            <div style={{fontSize:12,color:liked?"#00e5ff":"rgba(0,229,255,0.3)",display:"flex",alignItems:"center",gap:3}}>♥ {likeCount}</div>
          )}
        </div>
      </div>
    </div>
  );
}

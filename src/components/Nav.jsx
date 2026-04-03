import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { s } from "../styles/theme";
import { useWindowWidth } from "../hooks/useWindowWidth";
import { ProfileMenu } from "./ProfileMenu";

export function Nav({ user, isAdmin, page, setPage }) {
  const [mOpen, setMOpen] = useState(false);
  const w = useWindowWidth();
  const isMob = w < 640;

  return (
    <>
      <nav style={s.nav}>
        <div style={s.navLogo} className="kt-logo-glow" onClick={() => { setPage("home"); setMOpen(false); }}>
          КІН<span style={{color:"#00e5ff",textShadow:"0 0 20px #00e5ff"}}>●</span>ТАЙМ
        </div>

        {isMob ? (
          <button onClick={() => setMOpen(o => !o)} style={{background:"none",border:"none",cursor:"pointer",padding:8,display:"flex",flexDirection:"column",gap:5}}>
            {[0,1,2].map(i => (
              <span key={i} style={{display:"block",width:22,height:2,background:mOpen?"#00e5ff":"rgba(0,229,255,0.6)",borderRadius:2,transition:"all 0.3s",
                transform:mOpen&&i===0?"rotate(45deg) translate(5px,5px)":mOpen&&i===1?"scaleX(0)":mOpen&&i===2?"rotate(-45deg) translate(5px,-5px)":"none"}} />
            ))}
          </button>
        ) : (
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
        )}
      </nav>

      {isMob && mOpen && (
        <div style={{position:"fixed",top:72,left:0,right:0,bottom:0,background:"rgba(8,9,26,0.97)",backdropFilter:"blur(20px)",zIndex:99,display:"flex",flexDirection:"column",padding:"32px 24px",gap:12,borderTop:"1px solid rgba(0,229,255,0.15)"}}>
          {user ? (
            <>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 0",borderBottom:"1px solid rgba(0,229,255,0.1)",marginBottom:8}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:"#1a1a3a",border:"1px solid rgba(0,229,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Orbitron',sans-serif",fontWeight:700,color:"#00e5ff",fontSize:16}}>
                  {(user.displayName||user.email).slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{fontWeight:600,color:"#e0e8ff",fontSize:15}}>{user.displayName||user.email.split("@")[0]}</div>
                  <div style={{fontSize:12,color:"rgba(0,229,255,0.4)"}}>{user.email}</div>
                </div>
              </div>
              {isAdmin && <button onClick={()=>{setPage("admin");setMOpen(false);}} style={s.mobileDrawerBtn}>⚙ Админ панель</button>}
              <button onClick={()=>{setPage("subscribe");setMOpen(false);}} style={s.mobileDrawerBtn}>◈ Subscription</button>
              <button onClick={async()=>{await signOut(auth);setMOpen(false);setPage("home");}} style={{...s.mobileDrawerBtn,color:"#9966cc",borderColor:"rgba(124,58,237,0.3)"}}>→ Гарах</button>
            </>
          ) : (
            <>
              <button onClick={()=>{setPage("login");setMOpen(false);}} style={s.mobileDrawerBtn}>Нэвтрэх</button>
              <button onClick={()=>{setPage("register");setMOpen(false);}} style={{...s.mobileDrawerBtn,background:"linear-gradient(135deg,#7c3aed,#5b21b6)",borderColor:"rgba(124,58,237,0.5)",color:"#fff"}}>Бүртгүүлэх</button>
            </>
          )}
        </div>
      )}
    </>
  );
}

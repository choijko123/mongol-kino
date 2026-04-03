import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { s } from "../styles/theme";
import { ADMIN_EMAIL } from "../config/constants";

export function ProfileMenu({ user, setPage, isAdmin }) {
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
  const initials = name.slice(0, 2).toUpperCase();
  const uid = user.uid;
  const email = user.email;
  const joinedRaw = user.metadata?.creationTime;
  const joined = joinedRaw
    ? new Date(joinedRaw).toLocaleDateString("mn-MN", { year:"numeric", month:"long", day:"numeric" })
    : "—";
  const colors = ["#00e5ff","#7c3aed","#E91E8C","#3B82F6","#10B981","#f59e0b"];
  const avatarColor = colors[uid.charCodeAt(0) % colors.length];

  return (
    <div ref={menuRef} style={{position:"relative"}}>
      {/* Avatar trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          width:38,height:38,borderRadius:"50%",
          background: user.photoURL ? "transparent" : avatarColor + "33",
          border: `2px solid ${open ? "#00e5ff" : "rgba(0,229,255,0.3)"}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          cursor:"pointer",fontWeight:700,fontSize:13,
          color: avatarColor,
          overflow:"hidden",flexShrink:0,
          fontFamily:"'Orbitron',sans-serif",
          transition:"border-color 0.2s",
          boxShadow: open ? `0 0 12px ${avatarColor}66` : "none",
        }}
      >
        {user.photoURL
          ? <img src={user.photoURL} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
          : initials}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position:"absolute",top:"calc(100% + 12px)",right:0,
          width:"min(300px, calc(100vw - 32px))",
          background:"rgba(8,9,26,0.97)",
          border:"1px solid rgba(0,229,255,0.2)",
          borderRadius:16,overflow:"hidden",zIndex:200,
          boxShadow:"0 0 60px rgba(0,229,255,0.1), 0 24px 64px rgba(0,0,0,0.8)",
          animation:"pm-in 0.18s ease",
        }}>
          <style>{`@keyframes pm-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Header */}
          <div style={{background:"rgba(0,229,255,0.04)",padding:"20px",borderBottom:"1px solid rgba(0,229,255,0.1)"}}>
            <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:14}}>
              <div style={{
                width:56,height:56,borderRadius:"50%",flexShrink:0,
                background: user.photoURL ? "transparent" : avatarColor + "22",
                border:`2px solid ${avatarColor}55`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontWeight:700,fontSize:20,color:avatarColor,overflow:"hidden",
                fontFamily:"'Orbitron',sans-serif",
              }}>
                {user.photoURL
                  ? <img src={user.photoURL} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  : initials}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontWeight:700,fontSize:15,color:"#fff",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Rajdhani',sans-serif"}}>{name}</div>
                <div style={{display:"inline-block",fontSize:10,fontWeight:700,letterSpacing:1.5,
                  background:isAdmin?"rgba(0,229,255,0.12)":"rgba(124,58,237,0.12)",
                  color:isAdmin?"#00e5ff":"#9966cc",
                  padding:"2px 8px",borderRadius:4,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>
                  {isAdmin?"Админ":"Хэрэглэгч"}
                </div>
              </div>
            </div>

            {/* UID badge */}
            <div style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(0,229,255,0.1)",borderRadius:8,padding:"10px 12px",display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:9,color:"rgba(0,229,255,0.4)",letterSpacing:2,textTransform:"uppercase",marginBottom:4,fontFamily:"'Space Mono',monospace"}}>Хэрэглэгчийн ID</div>
                <div style={{fontSize:10,color:"rgba(0,229,255,0.6)",fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{uid}</div>
              </div>
              <button onClick={()=>navigator.clipboard?.writeText(uid)}
                style={{background:"rgba(0,229,255,0.08)",border:"1px solid rgba(0,229,255,0.2)",color:"rgba(0,229,255,0.7)",padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:10,fontFamily:"'Space Mono',monospace",flexShrink:0}}>
                Copy
              </button>
            </div>
          </div>

          {/* Info rows */}
          <div style={{padding:"8px 0"}}>
            {[
              {icon:"✉", label:"Имэйл", value:email},
              {icon:"📅", label:"Бүртгүүлсэн", value:joined},
              {icon:"🎬", label:"Үзсэн кино", value:"—"},
            ].map(({icon,label,value}) => (
              <div key={label} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 20px"}}>
                <span style={{fontSize:14,width:20,textAlign:"center",flexShrink:0}}>{icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,color:"rgba(0,229,255,0.3)",marginBottom:2,letterSpacing:1,textTransform:"uppercase",fontFamily:"'Space Mono',monospace"}}>{label}</div>
                  <div style={{fontSize:13,color:"rgba(224,232,255,0.8)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'Rajdhani',sans-serif"}}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{borderTop:"1px solid rgba(0,229,255,0.08)",padding:"8px 8px 10px"}}>
            <button onClick={()=>{setOpen(false);setPage("subscribe");}}
              style={{width:"100%",background:"transparent",border:"none",color:"#00e5ff",padding:"10px 14px",borderRadius:8,cursor:"pointer",textAlign:"left",fontSize:14,display:"flex",alignItems:"center",gap:10,fontFamily:"'Rajdhani',sans-serif",fontWeight:600,letterSpacing:1}}>
              ◈ Subscription авах
            </button>
            <button onClick={logout}
              style={{width:"100%",background:"transparent",border:"none",color:"#9966cc",padding:"10px 14px",borderRadius:8,cursor:"pointer",textAlign:"left",fontSize:14,display:"flex",alignItems:"center",gap:10,fontFamily:"'Rajdhani',sans-serif",fontWeight:600,letterSpacing:1}}>
              → Системээс гарах
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

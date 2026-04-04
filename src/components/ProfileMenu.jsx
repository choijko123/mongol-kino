import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { ADMIN_EMAIL } from "../config/constants";

const F = {
  orb:  "'Orbitron',sans-serif",
  raj:  "'Rajdhani',sans-serif",
  mono: "'Space Mono',monospace",
};

/* ── Subscription статус авах ── */
async function loadSubInfo(uid) {
  try {
    const snap = await getDoc(doc(db, "subscriptions", uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    if (d.status !== "active") return { status: d.status };
    const expiry = d.expiresAt?.toDate?.() || new Date(d.expiresAt);
    const now    = new Date();
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return { status: "expired" };
    return { status: "active", expiry, daysLeft };
  } catch { return null; }
}

export function ProfileMenu({ user, setPage, isAdmin }) {
  const [open,    setOpen]    = useState(false);
  const [subInfo, setSubInfo] = useState(null);
  const [copied,  setCopied]  = useState(false);
  const menuRef = React.useRef(null);

  /* Гаднаа дарахад хаах */
  useEffect(() => {
    function h(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* Subscription fetch — dropdown нээгдэх бүрт шинэчилнэ */
  useEffect(() => {
    if (!open || !user) return;
    loadSubInfo(user.uid).then(setSubInfo);
  }, [open, user]);

  async function logout() {
    await signOut(auth);
    setOpen(false);
    setPage("home");
  }

  function copyUid() {
    navigator.clipboard?.writeText(user.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const name        = user.displayName || user.email.split("@")[0];
  const initials    = name.slice(0, 2).toUpperCase();
  const uid         = user.uid;
  const email       = user.email;
  const joinedRaw   = user.metadata?.creationTime;
  const joined      = joinedRaw
    ? new Date(joinedRaw).toLocaleDateString("mn-MN", { year:"numeric", month:"long", day:"numeric" })
    : "—";
  const colors      = ["#00e5ff","#7c3aed","#E91E8C","#3B82F6","#10B981","#f59e0b"];
  const avatarColor = colors[uid.charCodeAt(0) % colors.length];

  /* Subscription badge props */
  const subBadge = (() => {
    if (!subInfo) return { label:"Subscription байхгүй", color:"rgba(180,200,255,0.3)", bg:"rgba(180,200,255,0.06)", icon:"○" };
    if (subInfo.status === "pending")  return { label:"Хүлээгдэж байна",  color:"#f59e0b", bg:"rgba(245,158,11,0.1)",  icon:"⏳" };
    if (subInfo.status === "rejected") return { label:"Татгалзсан",        color:"#ef4444", bg:"rgba(239,68,68,0.1)",   icon:"✕" };
    if (subInfo.status === "expired")  return { label:"Дууссан",           color:"#ef4444", bg:"rgba(239,68,68,0.08)",  icon:"!" };
    if (subInfo.status === "active")   return { label:"Идэвхтэй",          color:"#10b981", bg:"rgba(16,185,129,0.1)",  icon:"✓" };
    return { label:"—", color:"#888", bg:"transparent", icon:"?" };
  })();

  return (
    <div ref={menuRef} style={{position:"relative"}}>

      {/* ── Avatar trigger ── */}
      <div onClick={() => setOpen(o => !o)} style={{
        width:38, height:38, borderRadius:"50%",
        background: user.photoURL ? "transparent" : avatarColor + "28",
        border:`2px solid ${open ? "#00e5ff" : "rgba(0,229,255,0.3)"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", fontWeight:700, fontSize:13,
        color:avatarColor, overflow:"hidden", flexShrink:0,
        fontFamily:F.orb, transition:"all 0.2s",
        boxShadow: open ? `0 0 14px ${avatarColor}55` : "none",
        position:"relative",
      }}>
        {user.photoURL
          ? <img src={user.photoURL} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
          : initials
        }
        {/* Active sub green dot */}
        {subInfo?.status === "active" && (
          <span style={{
            position:"absolute", bottom:1, right:1,
            width:9, height:9, borderRadius:"50%",
            background:"#10b981", border:"2px solid #08091a",
            boxShadow:"0 0 6px #10b981",
          }} />
        )}
      </div>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 12px)", right:0,
          width:"min(320px, calc(100vw - 24px))",
          background:"rgba(6,7,22,0.98)",
          border:"1px solid rgba(0,229,255,0.18)",
          borderRadius:18, overflow:"hidden", zIndex:200,
          boxShadow:"0 0 60px rgba(0,229,255,0.08), 0 24px 64px rgba(0,0,0,0.85)",
          animation:"pm-in 0.2s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <style>{`@keyframes pm-in{from{opacity:0;transform:translateY(-10px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>

          {/* ═══ HEADER ═══ */}
          <div style={{background:"rgba(0,229,255,0.03)", padding:"20px 20px 16px", borderBottom:"1px solid rgba(0,229,255,0.08)"}}>
            <div style={{display:"flex", gap:14, alignItems:"center", marginBottom:16}}>
              {/* Big avatar */}
              <div style={{width:56, height:56, borderRadius:"50%", flexShrink:0, overflow:"hidden",
                background: user.photoURL ? "transparent" : avatarColor+"22",
                border:`2px solid ${avatarColor}55`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontWeight:700, fontSize:22, color:avatarColor, fontFamily:F.orb,
              }}>
                {user.photoURL
                  ? <img src={user.photoURL} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  : initials}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontWeight:700, fontSize:16, color:"#fff", marginBottom:5,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:F.raj}}>
                  {name}
                </div>
                <div style={{display:"inline-flex", alignItems:"center", gap:5,
                  background:isAdmin?"rgba(0,229,255,0.1)":"rgba(124,58,237,0.1)",
                  border:`1px solid ${isAdmin?"rgba(0,229,255,0.25)":"rgba(124,58,237,0.25)"}`,
                  color:isAdmin?"#00e5ff":"#9966cc",
                  padding:"2px 8px", borderRadius:4,
                  fontSize:9, fontWeight:700, letterSpacing:2,
                  textTransform:"uppercase", fontFamily:F.mono}}>
                  {isAdmin ? "⚙ Админ" : "◉ Хэрэглэгч"}
                </div>
              </div>
            </div>

            {/* UID badge */}
            <div style={{background:"rgba(0,0,0,0.4)", border:"1px solid rgba(0,229,255,0.1)",
              borderRadius:8, padding:"9px 12px", display:"flex", alignItems:"center", gap:10}}>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:9, color:"rgba(0,229,255,0.35)", letterSpacing:2,
                  textTransform:"uppercase", marginBottom:4, fontFamily:F.mono}}>
                  Хэрэглэгчийн ID
                </div>
                <div style={{fontSize:10, color:"rgba(0,229,255,0.55)", fontFamily:"monospace",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                  {uid}
                </div>
              </div>
              <button onClick={copyUid} style={{
                background: copied ? "rgba(16,185,129,0.15)" : "rgba(0,229,255,0.06)",
                border:`1px solid ${copied ? "rgba(16,185,129,0.4)" : "rgba(0,229,255,0.2)"}`,
                color: copied ? "#10b981" : "rgba(0,229,255,0.6)",
                padding:"4px 10px", borderRadius:6, cursor:"pointer",
                fontSize:9, fontFamily:F.mono, flexShrink:0, transition:"all 0.2s", letterSpacing:1,
              }}>
                {copied ? "✓ Хуулагдлаа" : "Copy"}
              </button>
            </div>
          </div>

          {/* ═══ SUBSCRIPTION CARD ═══ */}
          <div style={{padding:"14px 20px", borderBottom:"1px solid rgba(0,229,255,0.08)"}}>
            <div style={{fontSize:9, color:"rgba(0,229,255,0.35)", letterSpacing:2,
              textTransform:"uppercase", fontFamily:F.mono, marginBottom:10}}>
              Subscription
            </div>

            {/* Status badge */}
            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom: subInfo?.status==="active" ? 12 : 0}}>
              <div style={{
                display:"inline-flex", alignItems:"center", gap:6,
                background: subBadge.bg,
                border:`1px solid ${subBadge.color}44`,
                borderRadius:6, padding:"5px 12px",
              }}>
                <span style={{fontSize:11}}>{subBadge.icon}</span>
                <span style={{fontSize:11, fontWeight:700, color:subBadge.color,
                  fontFamily:F.mono, letterSpacing:1, textTransform:"uppercase"}}>
                  {subBadge.label}
                </span>
              </div>
            </div>

            {/* ── Active subscription detail ── */}
            {subInfo?.status === "active" && subInfo.daysLeft != null && (
              <div style={{
                background:"rgba(16,185,129,0.06)",
                border:"1px solid rgba(16,185,129,0.2)",
                borderRadius:12, padding:"14px 16px",
              }}>
                {/* Days remaining — big display */}
                <div style={{display:"flex", alignItems:"flex-end", gap:8, marginBottom:12}}>
                  <div style={{
                    fontFamily:F.orb, fontSize:48, fontWeight:900, lineHeight:1,
                    color: subInfo.daysLeft <= 3 ? "#ef4444" : subInfo.daysLeft <= 7 ? "#f59e0b" : "#10b981",
                    textShadow: subInfo.daysLeft <= 3 ? "0 0 20px rgba(239,68,68,0.5)" :
                                subInfo.daysLeft <= 7 ? "0 0 20px rgba(245,158,11,0.5)" :
                                "0 0 20px rgba(16,185,129,0.5)",
                  }}>
                    {subInfo.daysLeft}
                  </div>
                  <div style={{paddingBottom:8}}>
                    <div style={{fontSize:11, color:"rgba(16,185,129,0.8)", fontFamily:F.mono, letterSpacing:1, textTransform:"uppercase"}}>хоног</div>
                    <div style={{fontSize:10, color:"rgba(180,200,255,0.4)", fontFamily:F.mono, letterSpacing:0.5}}>үлдсэн</div>
                  </div>
                </div>

                {/* Progress bar */}
                <DaysProgressBar daysLeft={subInfo.daysLeft} totalDays={30} />

                {/* Expiry date */}
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10}}>
                  <span style={{fontSize:10, color:"rgba(180,200,255,0.4)", fontFamily:F.mono}}>Дуусах огноо</span>
                  <span style={{fontSize:11, color:"rgba(180,200,255,0.75)", fontFamily:F.raj, fontWeight:600}}>
                    {subInfo.expiry.toLocaleDateString("mn-MN", {year:"numeric",month:"long",day:"numeric"})}
                  </span>
                </div>

                {/* Warning if expiring soon */}
                {subInfo.daysLeft <= 5 && (
                  <div style={{
                    marginTop:10, padding:"8px 10px", borderRadius:7,
                    background: subInfo.daysLeft <= 3 ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.08)",
                    border:`1px solid ${subInfo.daysLeft<=3?"rgba(239,68,68,0.3)":"rgba(245,158,11,0.25)"}`,
                    fontSize:11, color:subInfo.daysLeft<=3?"#ef4444":"#f59e0b",
                    fontFamily:F.raj, fontWeight:600, display:"flex", alignItems:"center", gap:6,
                  }}>
                    {subInfo.daysLeft<=3 ? "⚠ Subscription дуусахад ойрхон байна!" : "⏳ Subscription дуусахад 5 хоног үлдсэн"}
                  </div>
                )}
              </div>
            )}

            {/* Pending info */}
            {subInfo?.status === "pending" && (
              <div style={{marginTop:8, fontSize:11, color:"rgba(245,158,11,0.7)", fontFamily:F.raj, lineHeight:1.6}}>
                Таны хүсэлтийг админ шалгаж байна. Удахгүй эрхийг нээнэ.
              </div>
            )}
          </div>

          {/* ═══ INFO ROWS ═══ */}
          <div style={{padding:"8px 0"}}>
            {[
              {icon:"✉", label:"Имэйл",          value:email},
              {icon:"📅", label:"Бүртгүүлсэн",   value:joined},
            ].map(({icon,label,value}) => (
              <div key={label} style={{display:"flex", alignItems:"center", gap:12, padding:"9px 20px"}}>
                <span style={{fontSize:14, width:20, textAlign:"center", flexShrink:0}}>{icon}</span>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:9, color:"rgba(0,229,255,0.3)", marginBottom:2,
                    letterSpacing:1.5, textTransform:"uppercase", fontFamily:F.mono}}>
                    {label}
                  </div>
                  <div style={{fontSize:13, color:"rgba(224,232,255,0.75)",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:F.raj}}>
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ═══ ACTIONS ═══ */}
          <div style={{borderTop:"1px solid rgba(0,229,255,0.08)", padding:"8px 10px 12px"}}>
            {/* Renew / Subscribe button */}
            {subInfo?.status !== "active" ? (
              <button onClick={()=>{setOpen(false);setPage("subscribe");}} style={{
                width:"100%", background:"linear-gradient(135deg,rgba(0,229,255,0.12),rgba(124,58,237,0.12))",
                border:"1px solid rgba(0,229,255,0.25)",
                color:"#00e5ff", padding:"10px 14px", borderRadius:10,
                cursor:"pointer", textAlign:"left", fontSize:13,
                display:"flex", alignItems:"center", gap:10,
                fontFamily:F.raj, fontWeight:700, letterSpacing:1,
                marginBottom:4, transition:"all 0.2s",
              }}>
                ◈ Subscription авах
              </button>
            ) : subInfo.daysLeft <= 7 ? (
              <button onClick={()=>{setOpen(false);setPage("subscribe");}} style={{
                width:"100%", background:"rgba(245,158,11,0.08)",
                border:"1px solid rgba(245,158,11,0.3)",
                color:"#f59e0b", padding:"10px 14px", borderRadius:10,
                cursor:"pointer", textAlign:"left", fontSize:13,
                display:"flex", alignItems:"center", gap:10,
                fontFamily:F.raj, fontWeight:700, letterSpacing:1,
                marginBottom:4, transition:"all 0.2s",
              }}>
                ↻ Сунгах
              </button>
            ) : null}

            <button onClick={logout} style={{
              width:"100%", background:"transparent", border:"none",
              color:"rgba(153,102,204,0.8)", padding:"10px 14px", borderRadius:10,
              cursor:"pointer", textAlign:"left", fontSize:13,
              display:"flex", alignItems:"center", gap:10,
              fontFamily:F.raj, fontWeight:700, letterSpacing:1, transition:"color 0.2s",
            }}>
              → Системээс гарах
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Days progress bar ── */
function DaysProgressBar({ daysLeft, totalDays }) {
  const pct   = Math.min(100, Math.max(0, (daysLeft / totalDays) * 100));
  const color = daysLeft <= 3 ? "#ef4444" : daysLeft <= 7 ? "#f59e0b" : "#10b981";
  const segs  = 30;

  return (
    <div>
      {/* Segmented bar */}
      <div style={{display:"flex", gap:2, marginBottom:6}}>
        {Array.from({length:segs}).map((_,i) => {
          const filled = i < Math.round((daysLeft / totalDays) * segs);
          return (
            <div key={i} style={{
              flex:1, height:5, borderRadius:2,
              background: filled ? color : "rgba(255,255,255,0.08)",
              boxShadow: filled ? `0 0 4px ${color}66` : "none",
              transition:"background 0.3s",
            }} />
          );
        })}
      </div>
      <div style={{display:"flex", justifyContent:"space-between", fontSize:9, color:"rgba(180,200,255,0.35)", fontFamily:"'Space Mono',monospace"}}>
        <span>0</span>
        <span>{totalDays} хоног</span>
      </div>
    </div>
  );
}

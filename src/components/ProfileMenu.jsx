import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { ADMIN_EMAIL } from "../config/constants";
import { useWindowWidth } from "../hooks/useWindowWidth";

const F = {
  orb:  "'Orbitron',sans-serif",
  raj:  "'Rajdhani',sans-serif",
  mono: "'Space Mono',monospace",
};

async function loadSubInfo(uid) {
  try {
    const snap = await getDoc(doc(db, "subscriptions", uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    if (d.status !== "active") return { status: d.status, plan: d.planLabel };
    const expiry   = d.expiresAt?.toDate?.() || new Date(d.expiresAt);
    const now      = new Date();
    const msLeft   = expiry - now;
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return { status: "expired" };
    const totalDays = d.days || 30;
    return { status:"active", expiry, daysLeft, totalDays, plan: d.planLabel };
  } catch { return null; }
}

export function ProfileMenu({ user, setPage, isAdmin }) {
  const [open,    setOpen]    = useState(false);
  const [subInfo, setSubInfo] = useState(null);
  const [copied,  setCopied]  = useState(false);
  const menuRef = React.useRef(null);
  const w       = useWindowWidth();
  const isMob   = w < 640;

  /* Гаднаа дарахад хаах — desktop only */
  useEffect(() => {
    if (isMob) return;
    function h(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [isMob]);

  /* Body scroll lock on mobile */
  useEffect(() => {
    if (isMob && open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMob, open]);

  /* Fetch sub info when opened */
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

  /* Sub color helpers */
  const subColor = (() => {
    if (!subInfo || subInfo.status === "pending")  return "#f59e0b";
    if (subInfo.status === "rejected")             return "#ef4444";
    if (subInfo.status === "expired")              return "#ef4444";
    if (subInfo.status === "active") {
      if (subInfo.daysLeft <= 3)  return "#ef4444";
      if (subInfo.daysLeft <= 7)  return "#f59e0b";
      return "#10b981";
    }
    return "rgba(180,200,255,0.3)";
  })();

  const subLabel = (() => {
    if (!subInfo)                       return "Subscription байхгүй";
    if (subInfo.status === "pending")   return "Хүлээгдэж байна";
    if (subInfo.status === "rejected")  return "Татгалзсан";
    if (subInfo.status === "expired")   return "Дууссан";
    if (subInfo.status === "active")    return "Идэвхтэй";
    return "—";
  })();

  /* ── SHARED CONTENT ── */
  function MenuContent() {
    return (
      <>
        {/* ── Header ── */}
        <div style={{ background:"rgba(0,229,255,0.03)", padding:"20px 20px 16px",
          borderBottom:"1px solid rgba(0,229,255,0.08)" }}>

          {/* Mobile drag handle */}
          {isMob && (
            <div style={{ width:36, height:4, borderRadius:2, background:"rgba(0,229,255,0.2)",
              margin:"0 auto 18px" }} />
          )}

          <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:14 }}>
            {/* Avatar */}
            <div style={{ width:54, height:54, borderRadius:"50%", flexShrink:0,
              background: user.photoURL ? "transparent" : avatarColor+"22",
              border:`2px solid ${avatarColor}55`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontWeight:700, fontSize:20, color:avatarColor,
              overflow:"hidden", fontFamily:F.orb, position:"relative" }}>
              {user.photoURL
                ? <img src={user.photoURL} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                : initials}
              {subInfo?.status === "active" && (
                <span style={{ position:"absolute", bottom:1, right:1, width:10, height:10,
                  borderRadius:"50%", background:subColor, border:"2px solid #08091a",
                  boxShadow:`0 0 6px ${subColor}` }} />
              )}
            </div>

            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontWeight:700, fontSize:16, color:"#fff", marginBottom:5,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:F.raj }}>
                {name}
              </div>
              <div style={{ display:"inline-flex", alignItems:"center", gap:5,
                background:isAdmin?"rgba(0,229,255,0.1)":"rgba(124,58,237,0.1)",
                border:`1px solid ${isAdmin?"rgba(0,229,255,0.25)":"rgba(124,58,237,0.25)"}`,
                color:isAdmin?"#00e5ff":"#9966cc",
                padding:"2px 8px", borderRadius:4,
                fontSize:9, fontWeight:700, letterSpacing:2,
                textTransform:"uppercase", fontFamily:F.mono }}>
                {isAdmin ? "⚙ Админ" : "◉ Хэрэглэгч"}
              </div>
            </div>

            {/* Close button on mobile */}
            {isMob && (
              <button onClick={() => setOpen(false)} style={{
                background:"rgba(0,229,255,0.06)", border:"1px solid rgba(0,229,255,0.15)",
                borderRadius:"50%", width:32, height:32, cursor:"pointer",
                color:"rgba(0,229,255,0.6)", fontSize:16, flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                ✕
              </button>
            )}
          </div>

          {/* UID */}
          <div style={{ background:"rgba(0,0,0,0.4)", border:"1px solid rgba(0,229,255,0.1)",
            borderRadius:8, padding:"9px 12px", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:9, color:"rgba(0,229,255,0.35)", letterSpacing:2,
                textTransform:"uppercase", marginBottom:4, fontFamily:F.mono }}>ID</div>
              <div style={{ fontSize:10, color:"rgba(0,229,255,0.55)", fontFamily:"monospace",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {uid}
              </div>
            </div>
            <button onClick={copyUid} style={{
              background: copied ? "rgba(16,185,129,0.15)" : "rgba(0,229,255,0.06)",
              border:`1px solid ${copied ? "rgba(16,185,129,0.4)" : "rgba(0,229,255,0.2)"}`,
              color: copied ? "#10b981" : "rgba(0,229,255,0.6)",
              padding:"4px 10px", borderRadius:6, cursor:"pointer",
              fontSize:9, fontFamily:F.mono, flexShrink:0, transition:"all 0.2s" }}>
              {copied ? "✓ OK" : "Copy"}
            </button>
          </div>
        </div>

        {/* ── SUBSCRIPTION ── */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(0,229,255,0.08)" }}>
          <div style={{ fontSize:9, color:"rgba(0,229,255,0.35)", letterSpacing:2,
            textTransform:"uppercase", fontFamily:F.mono, marginBottom:12 }}>
            Subscription
          </div>

          {/* Active — full detail */}
          {subInfo?.status === "active" ? (
            <div style={{ background:`${subColor}0d`,
              border:`1px solid ${subColor}33`, borderRadius:14, overflow:"hidden" }}>

              {/* Top row: days left + label */}
              <div style={{ display:"flex", alignItems:"stretch" }}>
                {/* Big number */}
                <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center",
                  borderRight:`1px solid ${subColor}22`, flexShrink:0, minWidth:80 }}>
                  <div style={{ fontFamily:F.orb, fontSize:40, fontWeight:900, lineHeight:1,
                    color:subColor, textShadow:`0 0 16px ${subColor}66` }}>
                    {subInfo.daysLeft}
                  </div>
                  <div style={{ fontSize:9, color:`${subColor}cc`, fontFamily:F.mono,
                    letterSpacing:1.5, textTransform:"uppercase", marginTop:4 }}>
                    хоног
                  </div>
                </div>

                {/* Right info */}
                <div style={{ flex:1, padding:"14px 16px", display:"flex",
                  flexDirection:"column", justifyContent:"center", gap:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%",
                      background:subColor, boxShadow:`0 0 6px ${subColor}`,
                      flexShrink:0, animation:"sub-pulse 2s infinite" }} />
                    <span style={{ fontSize:11, fontWeight:700, color:subColor,
                      fontFamily:F.mono, letterSpacing:1, textTransform:"uppercase" }}>
                      Идэвхтэй
                    </span>
                    {subInfo.plan && (
                      <span style={{ fontSize:9, color:`${subColor}88`,
                        fontFamily:F.mono, marginLeft:4 }}>· {subInfo.plan}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize:9, color:"rgba(180,200,255,0.35)",
                      fontFamily:F.mono, letterSpacing:1, marginBottom:3 }}>
                      ДУУСАХ ОГНОО
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:"#fff", fontFamily:F.raj }}>
                      {subInfo.expiry.toLocaleDateString("mn-MN", {
                        year:"numeric", month:"long", day:"numeric"
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ padding:"0 16px 14px" }}>
                <DaysBar daysLeft={subInfo.daysLeft} totalDays={subInfo.totalDays} color={subColor} />
              </div>

              {/* Expiry warning */}
              {subInfo.daysLeft <= 5 && (
                <div style={{ margin:"0 12px 12px", padding:"8px 12px", borderRadius:8,
                  background: subInfo.daysLeft <= 3 ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.08)",
                  border:`1px solid ${subInfo.daysLeft<=3?"rgba(239,68,68,0.3)":"rgba(245,158,11,0.2)"}`,
                  fontSize:12, color:subColor, fontFamily:F.raj, fontWeight:600 }}>
                  {subInfo.daysLeft <= 3
                    ? "⚠ Subscription удахгүй дуусна! Сунгана уу."
                    : "⏳ Subscription дуусахад 5 хоног үлдлээ."}
                </div>
              )}
            </div>
          ) : (
            /* Non-active states */
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6,
                background:`${subColor}12`, border:`1px solid ${subColor}33`,
                borderRadius:8, padding:"8px 14px" }}>
                <span style={{ fontSize:13 }}>
                  {!subInfo ? "○" : subInfo.status==="pending" ? "⏳" : "✕"}
                </span>
                <span style={{ fontSize:12, fontWeight:700, color:subColor,
                  fontFamily:F.mono, letterSpacing:1, textTransform:"uppercase" }}>
                  {subLabel}
                </span>
              </div>
              {subInfo?.status === "pending" && (
                <span style={{ fontSize:11, color:"rgba(180,200,255,0.4)", fontFamily:F.raj }}>
                  Шалгаж байна...
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── INFO ROWS ── */}
        <div style={{ padding:"8px 0" }}>
          {[
            { icon:"✉", label:"Имэйл",        value: email },
            { icon:"📅", label:"Бүртгүүлсэн", value: joined },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ display:"flex", alignItems:"center",
              gap:12, padding:"9px 20px" }}>
              <span style={{ fontSize:14, width:20, textAlign:"center", flexShrink:0 }}>{icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:9, color:"rgba(0,229,255,0.3)", marginBottom:2,
                  letterSpacing:1.5, textTransform:"uppercase", fontFamily:F.mono }}>{label}</div>
                <div style={{ fontSize:13, color:"rgba(224,232,255,0.75)",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  fontFamily:F.raj }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── ACTIONS ── */}
        <div style={{ borderTop:"1px solid rgba(0,229,255,0.08)", padding:"8px 10px 16px" }}>
          {subInfo?.status !== "active" ? (
            <button onClick={() => { setOpen(false); setPage("subscribe"); }} style={actionBtn("#00e5ff")}>
              ◈ Subscription авах
            </button>
          ) : subInfo.daysLeft <= 7 ? (
            <button onClick={() => { setOpen(false); setPage("subscribe"); }} style={actionBtn("#f59e0b", "rgba(245,158,11,0.08)", "rgba(245,158,11,0.3)")}>
              ↻ Сунгах
            </button>
          ) : null}
          <button onClick={logout} style={actionBtn("rgba(153,102,204,0.8)", "transparent", "transparent")}>
            → Системээс гарах
          </button>
        </div>

        <style>{`
          @keyframes sub-pulse {
            0%,100%{opacity:1} 50%{opacity:0.5}
          }
          @keyframes pm-in {
            from{opacity:0;transform:translateY(-10px) scale(0.97)}
            to{opacity:1;transform:translateY(0) scale(1)}
          }
          @keyframes sheet-up {
            from{transform:translateY(100%)}
            to{transform:translateY(0)}
          }
        `}</style>
      </>
    );
  }

  return (
    <div ref={menuRef} style={{ position:"relative" }}>

      {/* Avatar trigger */}
      <div onClick={() => setOpen(o => !o)} style={{
        width:38, height:38, borderRadius:"50%",
        background: user.photoURL ? "transparent" : avatarColor+"28",
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
          : initials}
        {subInfo?.status === "active" && (
          <span style={{ position:"absolute", bottom:1, right:1, width:9, height:9,
            borderRadius:"50%", background:subColor, border:"2px solid #08091a",
            boxShadow:`0 0 6px ${subColor}` }} />
        )}
      </div>

      {/* ── MOBILE: bottom sheet ── */}
      {isMob && open && (
        <>
          {/* Backdrop */}
          <div onClick={() => setOpen(false)} style={{
            position:"fixed", inset:0, zIndex:190,
            background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)",
          }} />
          {/* Sheet */}
          <div style={{
            position:"fixed", bottom:0, left:0, right:0, zIndex:191,
            background:"rgba(6,7,22,0.99)",
            border:"1px solid rgba(0,229,255,0.18)",
            borderRadius:"20px 20px 0 0",
            boxShadow:"0 -8px 60px rgba(0,229,255,0.1), 0 -24px 80px rgba(0,0,0,0.8)",
            maxHeight:"90vh", overflowY:"auto",
            animation:"sheet-up 0.32s cubic-bezier(0.16,1,0.3,1)",
          }}>
            <MenuContent />
          </div>
        </>
      )}

      {/* ── DESKTOP: dropdown ── */}
      {!isMob && open && (
        <div style={{
          position:"absolute", top:"calc(100% + 12px)", right:0,
          width:320,
          background:"rgba(6,7,22,0.98)",
          border:"1px solid rgba(0,229,255,0.18)",
          borderRadius:18, overflow:"hidden", zIndex:200,
          boxShadow:"0 0 60px rgba(0,229,255,0.08), 0 24px 64px rgba(0,0,0,0.85)",
          animation:"pm-in 0.2s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <MenuContent />
        </div>
      )}
    </div>
  );
}

/* ── Segmented progress bar ── */
function DaysBar({ daysLeft, totalDays, color }) {
  const segs   = Math.min(totalDays, 30);
  const filled = Math.round((daysLeft / totalDays) * segs);
  return (
    <div>
      <div style={{ display:"flex", gap:2, marginBottom:5 }}>
        {Array.from({ length:segs }).map((_, i) => (
          <div key={i} style={{
            flex:1, height:4, borderRadius:2,
            background: i < filled ? color : "rgba(255,255,255,0.07)",
            boxShadow: i < filled ? `0 0 4px ${color}55` : "none",
          }} />
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between",
        fontSize:9, color:"rgba(180,200,255,0.3)", fontFamily:"'Space Mono',monospace" }}>
        <span>0</span>
        <span style={{ color:`${color}88` }}>{daysLeft} хоног үлдсэн</span>
        <span>{totalDays}</span>
      </div>
    </div>
  );
}

/* ── Action button helper ── */
function actionBtn(color, bg = "transparent", border = "transparent") {
  return {
    width:"100%", background: bg,
    border:`1px solid ${border}`,
    color, padding:"10px 14px", borderRadius:10,
    cursor:"pointer", textAlign:"left", fontSize:13,
    display:"flex", alignItems:"center", gap:10,
    fontFamily:"'Rajdhani',sans-serif", fontWeight:700,
    letterSpacing:1, marginBottom:4, transition:"all 0.2s",
  };
}

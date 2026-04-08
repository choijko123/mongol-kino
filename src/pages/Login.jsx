import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { signInWithGoogle, getRedirectResult } from "../services/googleAuth";
import { s } from "../styles/theme";
import { useWindowWidth } from "../hooks/useWindowWidth";

export function Login({ setPage, showToast }) {
  const [email,   setEmail]   = useState("");
  const [pw,      setPw]      = useState("");
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);
  const [gLoad,   setGLoad]   = useState(false);
  const w     = useWindowWidth();
  const isMob = w < 640;

  /* Redirect буцаж ирэх үед барна */
  useEffect(() => {
    setGLoad(true);
    getRedirectResult(auth)
      .then(result => {
        if (result?.user) {
          showToast("Google-оор амжилттай нэвтэрлээ!");
          setPage("home");
        }
      })
      .catch(err => {
        if (err.code !== "auth/no-redirect-operation") {
          setErr("Google нэвтрэлт амжилтгүй: " + err.message);
        }
      })
      .finally(() => setGLoad(false));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pw);
      showToast("Амжилттай нэвтэрлээ!");
      setPage("home");
    } catch {
      setErr("Имэйл эсвэл нууц үг буруу байна.");
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setErr(""); setGLoad(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        // Popup амжилттай (desktop)
        showToast("Google-оор амжилттай нэвтэрлээ!");
        setPage("home");
      }
      // user === null бол redirect явсан, хүлээнэ
    } catch (e) {
      if (e.code !== "auth/popup-closed-by-user") {
        setErr("Google нэвтрэлт амжилтгүй боллоо.");
      }
      setGLoad(false);
    }
  }

  return (
    <div style={s.authWrap}>
      <div style={{ ...s.authBox, padding:isMob?"24px 20px":"32px 28px" }} className="kt-auth-slide">
        <div style={s.authLogo} className="kt-logo-glow">
          КИН<span style={{color:"#00e5ff"}}>●</span>ТАЙМ
        </div>
        <div style={s.authTitle}>Системд нэвтрэх</div>

        <GoogleBtn loading={gLoad} onClick={handleGoogle} label="Google-оор нэвтрэх" />
        <Divider />

        <form onSubmit={submit} style={s.form}>
          <label style={s.label}>Имэйл</label>
          <input style={s.input} type="email" value={email}
            onChange={e=>setEmail(e.target.value)} placeholder="ta@example.com" required />
          <label style={s.label}>Нууц үг</label>
          <input style={s.input} type="password" value={pw}
            onChange={e=>setPw(e.target.value)} placeholder="••••••••" required />
          {err && <div style={s.errMsg}>{err}</div>}
          <button type="submit" disabled={loading || gLoad}
            style={{ ...s.btnRed, opacity:(loading||gLoad)?0.6:1 }}>
            {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
          </button>
        </form>

        <p style={s.authSwitch}>
          Бүртгэл байхгүй юу?{" "}
          <span style={s.authLink} onClick={()=>setPage("register")}>Бүртгүүлэх</span>
        </p>
      </div>
    </div>
  );
}

export function GoogleBtn({ loading, onClick, label }) {
  return (
    <button type="button" onClick={onClick} disabled={loading} style={{
      width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10,
      padding:"12px 18px", marginTop:8,
      background:"rgba(255,255,255,0.06)",
      border:"1px solid rgba(255,255,255,0.14)",
      borderRadius:10, cursor:loading?"not-allowed":"pointer",
      color:"#e0e8ff", fontFamily:"'Rajdhani',sans-serif",
      fontWeight:700, fontSize:14, letterSpacing:0.5,
      transition:"all 0.2s", opacity:loading?0.7:1,
    }}>
      {loading
        ? <span style={{width:18,height:18,border:"2px solid rgba(0,229,255,0.3)",
            borderTopColor:"#00e5ff",borderRadius:"50%",display:"inline-block",
            animation:"kt-gspin 0.7s linear infinite"}} />
        : <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.2 6.6 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.5 18.9 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.2 6.6 29.4 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.5 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.2 5.2C37 38.5 44 33 44 24c0-1.2-.1-2.4-.4-3.5z"/>
          </svg>
      }
      {loading ? "Үргэлжилж байна..." : label}
    </button>
  );
}

export function Divider() {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,margin:"18px 0"}}>
      <div style={{flex:1,height:1,background:"rgba(0,229,255,0.1)"}} />
      <span style={{fontSize:11,color:"rgba(180,200,255,0.3)",fontFamily:"'Space Mono',monospace",letterSpacing:2}}>
        ЭСВЭЛ
      </span>
      <div style={{flex:1,height:1,background:"rgba(0,229,255,0.1)"}} />
    </div>
  );
}
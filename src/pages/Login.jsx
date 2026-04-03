import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { s } from "../styles/theme";
import { useWindowWidth } from "../hooks/useWindowWidth";

export function Login({ setPage, showToast }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const w = useWindowWidth();
  const isMob = w < 640;

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      await signInWithEmailAndPassword(auth, email, pw);
      showToast("Амжилттай нэвтэрлээ!");
      setPage("home");
    } catch {
      setErr("Имэйл эсвэл нууц үг буруу байна.");
    }
  }

  return (
    <div style={s.authWrap}>
      <div style={{...s.authBox, padding:isMob?"24px 20px":"32px 24px"}} className="kt-auth-slide">
        <div style={s.authLogo} className="kt-logo-glow">
          КИН<span style={{color:"#00e5ff"}}>●</span>ТАЙМ
        </div>
        <div style={s.authTitle}>Системд нэвтрэх</div>
        <form onSubmit={submit} style={s.form}>
          <label style={s.label}>Имэйл</label>
          <input style={s.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ta@example.com" required />
          <label style={s.label}>Нууц үг</label>
          <input style={s.input} type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" required />
          {err && <div style={s.errMsg}>{err}</div>}
          <button type="submit" style={s.btnRed}>Нэвтрэх</button>
        </form>
        <p style={s.authSwitch}>
          Бүртгэл байхгүй юу?{" "}
          <span style={s.authLink} onClick={()=>setPage("register")}>Бүртгүүлэх</span>
        </p>
      </div>
    </div>
  );
}

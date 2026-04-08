import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { signInWithGoogle, getRedirectResult } from "../services/googleAuth";
import { s } from "../styles/theme";
import { useWindowWidth } from "../hooks/useWindowWidth";
import { GoogleBtn, Divider } from "./Login";

export function Register({ setPage, showToast }) {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [pw,      setPw]      = useState("");
  const [pw2,     setPw2]     = useState("");
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);
  const [gLoad,   setGLoad]   = useState(false);
  const w     = useWindowWidth();
  const isMob = w < 640;

  useEffect(() => {
    setGLoad(true);
    getRedirectResult(auth)
      .then(result => {
        if (result?.user) {
          showToast("Google-оор амжилттай бүртгүүллээ!");
          setPage("home");
        }
      })
      .catch(() => {})
      .finally(() => setGLoad(false));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    if (pw !== pw2)    { setErr("Нууц үг таарахгүй байна."); setLoading(false); return; }
    if (pw.length < 6) { setErr("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой."); setLoading(false); return; }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pw);
      await updateProfile(cred.user, { displayName: name });
      showToast("Бүртгэл амжилттай үүслээ!");
      setPage("home");
    } catch (e) {
      if (e.code === "auth/email-already-in-use") setErr("Энэ имэйл бүртгэлтэй байна.");
      else setErr("Бүртгэл үүсгэхэд алдаа гарлаа.");
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setErr(""); setGLoad(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        showToast("Google-оор амжилттай бүртгүүллээ!");
        setPage("home");
      }
    } catch (e) {
      if (e.code !== "auth/popup-closed-by-user") {
        setErr("Google бүртгэл амжилтгүй боллоо.");
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
        <div style={s.authTitle}>Шинэ бүртгэл үүсгэх</div>

        <GoogleBtn loading={gLoad} onClick={handleGoogle} label="Google-оор бүртгүүлэх" />
        <Divider />

        <form onSubmit={submit} style={s.form}>
          <label style={s.label}>Нэр</label>
          <input style={s.input} value={name}
            onChange={e=>setName(e.target.value)} placeholder="Таны нэр" required />
          <label style={s.label}>Имэйл</label>
          <input style={s.input} type="email" value={email}
            onChange={e=>setEmail(e.target.value)} placeholder="ta@example.com" required />
          <label style={s.label}>Нууц үг</label>
          <input style={s.input} type="password" value={pw}
            onChange={e=>setPw(e.target.value)} placeholder="••••••••" required />
          <label style={s.label}>Нууц үг давтах</label>
          <input style={s.input} type="password" value={pw2}
            onChange={e=>setPw2(e.target.value)} placeholder="••••••••" required />
          {err && <div style={s.errMsg}>{err}</div>}
          <button type="submit" disabled={loading || gLoad}
            style={{ ...s.btnRed, opacity:(loading||gLoad)?0.6:1 }}>
            {loading ? "Бүртгүүлж байна..." : "Бүртгүүлэх"}
          </button>
        </form>

        <p style={s.authSwitch}>
          Бүртгэлтэй юу?{" "}
          <span style={s.authLink} onClick={()=>setPage("login")}>Нэвтрэх</span>
        </p>
      </div>
    </div>
  );
}

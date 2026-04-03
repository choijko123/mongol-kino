import React, { useState } from "react";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { s } from "../styles/theme";
import { BANK_INFO } from "../config/constants";

export function Subscribe({ user, setPage, subStatus, showToast }) {
  const [copied, setCopied] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [note, setNote] = React.useState("");

  function copyAccount() {
    navigator.clipboard?.writeText(BANK_INFO.account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendRequest() {
    if (!user) { setPage("login"); return; }
    if (!note.trim()) { showToast("Гүйлгээний дугаар оруулна уу!", "error"); return; }
    setSending(true);
    try {
      await setDoc(doc(db, "subscriptions", user.uid), {
        uid: user.uid,
        email: user.email,
        name: user.displayName || "",
        status: "pending",
        note: note.trim(),
        requestedAt: serverTimestamp(),
      });
      showToast("Хүсэлт илгээгдлээ! Админ шалгаад эрхийг нээнэ.");
      setPage("home");
    } catch(err) {
      showToast("Алдаа гарлаа: " + err.message, "error");
    }
    setSending(false);
  }

  return (
    <div style={{maxWidth:480, margin:"0 auto", padding:"24px 16px"}}>
      <button style={s.backBtn} onClick={()=>setPage("home")}>← Буцах</button>

      {subStatus === "pending" ? (
        <div style={{background:"#111", border:"1px solid #2a2a2a", borderRadius:16, padding:32, textAlign:"center"}}>
          <div style={{fontSize:48, marginBottom:16}}>⏳</div>
          <h2 style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:"#fff", margin:"0 0 10px"}}>Хүсэлт хүлээгдэж байна</h2>
          <p style={{color:"#777", fontSize:14, lineHeight:1.7}}>Таны subscription хүсэлтийг админ шалгаж байна. Удахгүй эрхийг нээнэ.</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{textAlign:"center", marginBottom:32}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:42, color:"#fff", letterSpacing:2}}>
              КИНО<span style={{color:"#FF3B3B"}}>ТАЙМ</span>
            </div>
            <div style={{fontSize:14, color:"#666", marginTop:4}}>Subscription авч бүх кинонд нэвтрэх</div>
          </div>

          {/* Plan card */}
          <div style={{background:"#111", border:"1.5px solid #FF3B3B", borderRadius:16, padding:28, marginBottom:20}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20}}>
              <div>
                <div style={{fontSize:11, color:"#FF3B3B", fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:4}}>Сарын эрх</div>
                <div style={{fontSize:36, fontWeight:800, color:"#fff"}}>{BANK_INFO.currency}{BANK_INFO.price}</div>
              </div>
              <div style={{background:"rgba(255,59,59,0.1)", borderRadius:10, padding:"8px 14px", textAlign:"center"}}>
                <div style={{fontSize:24, fontWeight:800, color:"#FF3B3B"}}>{BANK_INFO.days}</div>
                <div style={{fontSize:11, color:"#FF3B3B"}}>хоног</div>
              </div>
            </div>
            {["Бүх кино үзэх", "HD чанар", "Дурын төхөөрөмж", "Шинэ кино шууд харах"].map(f => (
              <div key={f} style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
                <span style={{color:"#FF3B3B", fontSize:16}}>✓</span>
                <span style={{color:"#ccc", fontSize:14}}>{f}</span>
              </div>
            ))}
          </div>

          {/* Bank info */}
          <div style={{background:"#111", border:"1px solid #222", borderRadius:14, padding:24, marginBottom:20}}>
            <div style={{fontSize:12, color:"#555", textTransform:"uppercase", letterSpacing:1.5, marginBottom:16}}>Шилжүүлэх дансны мэдээлэл</div>
            {[
              {label:"Банк", value: BANK_INFO.bank},
              {label:"Дансны нэр", value: BANK_INFO.name},
              {label:"Дансны дугаар", value: BANK_INFO.account, copy:true},
              {label:"Дүн", value: BANK_INFO.currency + BANK_INFO.price},
            ].map(({label, value, copy}) => (
              <div key={label} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #1a1a1a"}}>
                <span style={{fontSize:13, color:"#666"}}>{label}</span>
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <span style={{fontSize:14, color:"#fff", fontWeight: copy ? 700 : 400, fontFamily: copy ? "monospace" : "inherit", letterSpacing: copy ? 1 : 0}}>{value}</span>
                  {copy && (
                    <button onClick={copyAccount} style={{
                      background: copied ? "rgba(29,185,84,0.2)" : "#1a1a1a",
                      border:"1px solid " + (copied ? "#1db954" : "#2a2a2a"),
                      color: copied ? "#1db954" : "#888",
                      padding:"3px 10px", borderRadius:6, cursor:"pointer",
                      fontSize:11, fontFamily:"'Outfit',sans-serif",
                    }}>
                      {copied ? "Хуулагдлаа ✓" : "Хуулах"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div style={{marginTop:14, background:"rgba(255,59,59,0.06)", border:"1px solid rgba(255,59,59,0.2)", borderRadius:8, padding:"10px 14px"}}>
              <div style={{fontSize:12, color:"#FF3B3B", fontWeight:600, marginBottom:4}}>⚠ Гүйлгээний утга</div>
              <div style={{fontSize:12, color:"#aaa"}}>Гүйлгээний утга хэсэгт <strong style={{color:"#fff"}}>"{user?.email}"</strong> гэж бичнэ үү</div>
            </div>
          </div>

          {/* Confirmation */}
          <div style={{background:"#111", border:"1px solid #222", borderRadius:14, padding:24}}>
            <div style={{fontSize:13, color:"#888", marginBottom:10}}>Мөнгө шилжүүлсний дараа гүйлгээний дугаар эсвэл дэлгэцийн зургийн тайлбар оруулна уу:</div>
            <textarea
              value={note}
              onChange={e=>setNote(e.target.value)}
              placeholder="Жишээ: 230501 гүйлгээ хийлээ"
              style={{...s.input, height:80, resize:"none", width:"100%", marginBottom:14}}
            />
            <button onClick={sendRequest} disabled={sending} style={{...s.btnRed, marginTop:0}}>
              {sending ? "Илгээж байна..." : "Хүсэлт илгээх"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ══════════ SUB GATE (subscription шаарддаг хуудас) ══════════

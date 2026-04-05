import React, { useState } from "react";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { BANK_INFO, PLANS } from "../config/constants";
import { useWindowWidth } from "../hooks/useWindowWidth";

const F = {
  orb:  "'Orbitron',sans-serif",
  raj:  "'Rajdhani',sans-serif",
  mono: "'Space Mono',monospace",
};

export function Subscribe({ user, setPage, subStatus, showToast }) {
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1].id); // default: monthly
  const [note,         setNote]         = useState("");
  const [sending,      setSending]      = useState(false);
  const [step,         setStep]         = useState(1); // 1=сонгох, 2=төлбөр, 3=илгээх
  const [copiedField,  setCopiedField]  = useState(null);
  const w    = useWindowWidth();
  const isMob = w < 640;

  const plan = PLANS.find(p => p.id === selectedPlan) || PLANS[1];

  function copy(text, field) {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2200);
  }

  async function sendRequest() {
    if (!user)        { setPage("login"); return; }
    if (!note.trim()) { showToast("Гүйлгээний мэдээлэл оруулна уу!", "error"); return; }
    setSending(true);
    try {
      await setDoc(doc(db, "subscriptions", user.uid), {
        uid:         user.uid,
        email:       user.email,
        name:        user.displayName || "",
        plan:        plan.id,
        planLabel:   plan.label,
        days:        plan.days,
        price:       plan.price,
        status:      "pending",
        note:        note.trim(),
        requestedAt: serverTimestamp(),
      });
      showToast("Хүсэлт амжилттай илгээгдлээ! Админ шалгаад нээнэ.");
      setPage("home");
    } catch (err) {
      showToast("Алдаа гарлаа: " + err.message, "error");
    }
    setSending(false);
  }

  /* ── Хүлээгдэж байна screen ── */
  if (subStatus === "pending") {
    return (
      <div style={wrap(isMob)}>
        <style>{subCss}</style>
        <div style={pendingBox}>
          <div style={{ fontSize:56, marginBottom:20 }}>⏳</div>
          <div style={{ fontFamily:F.orb, fontSize:20, fontWeight:700, color:"#00e5ff",
            letterSpacing:2, marginBottom:12, textTransform:"uppercase" }}>
            Хүлээгдэж байна
          </div>
          <p style={{ color:"rgba(180,200,255,0.55)", fontSize:14, lineHeight:1.8,
            maxWidth:320, margin:"0 auto 28px", fontFamily:F.raj }}>
            Таны subscription хүсэлтийг админ шалгаж байна. Удахгүй эрхийг нээнэ.
          </p>
          <button onClick={() => setPage("home")} style={backBtnStyle}>← Нүүр хуудас</button>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap(isMob)}>
      <style>{subCss}</style>

      {/* ── Back + breadcrumb ── */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:32 }}>
        <button onClick={() => step > 1 ? setStep(s => s-1) : setPage("home")} style={backBtnStyle}>
          ← {step > 1 ? "Буцах" : "Нүүр"}
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {["Төлөвлөгөө", "Данс", "Баталгаа"].map((l,i) => (
            <React.Fragment key={l}>
              <div style={{
                fontSize:11, fontFamily:F.mono, letterSpacing:1,
                color: step > i ? "#00e5ff" : step === i+1 ? "#fff" : "rgba(180,200,255,0.3)",
                fontWeight: step === i+1 ? 700 : 400,
              }}>{i+1}. {l}</div>
              {i < 2 && <span style={{ color:"rgba(0,229,255,0.25)", fontSize:10 }}>›</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ══════════ STEP 1 — ПЛАН СОНГОХ ══════════ */}
      {step === 1 && (
        <div>
          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:36 }}>
            <div style={{ fontFamily:F.orb, fontSize:isMob?28:36, fontWeight:900,
              color:"#fff", letterSpacing:3, marginBottom:8 }}>
              КИН<span style={{ color:"#00e5ff", textShadow:"0 0 20px #00e5ff" }}>●</span>ТАЙМ
            </div>
            <div style={{ fontSize:13, color:"rgba(180,200,255,0.45)", fontFamily:F.mono, letterSpacing:2 }}>
              SUBSCRIPTION СОНГОНО УУ
            </div>
          </div>

          {/* Plan cards — centered row */}
          <div style={{
            display:"flex",
            gap:14,
            justifyContent:"center",
            flexWrap: isMob ? "wrap" : "nowrap",
            marginBottom:36,
          }}>
            {PLANS.map(p => {
              const active = selectedPlan === p.id;
              return (
                <div key={p.id} className="sub-plan-card"
                  onClick={() => setSelectedPlan(p.id)}
                  style={{
                    width: isMob ? "100%" : 220,
                    maxWidth: isMob ? 360 : 220,
                    background: active
                      ? `linear-gradient(160deg, ${p.accent}18 0%, rgba(8,9,26,0.95) 60%)`
                      : "rgba(10,12,35,0.7)",
                    border: active ? `2px solid ${p.accent}` : "1.5px solid rgba(0,229,255,0.1)",
                    borderRadius:20,
                    padding:"28px 22px",
                    cursor:"pointer",
                    position:"relative",
                    backdropFilter:"blur(16px)",
                    boxShadow: active
                      ? `0 0 40px ${p.accent}22, 0 20px 60px rgba(0,0,0,0.5)`
                      : "0 8px 32px rgba(0,0,0,0.4)",
                    transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                    transform: active && !isMob ? "translateY(-8px) scale(1.02)" : "none",
                  }}>

                  {/* Badge */}
                  {p.badge && (
                    <div style={{
                      position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)",
                      background:`linear-gradient(135deg,${p.accent},${p.accent}bb)`,
                      color: p.accent === "#f59e0b" ? "#08091a" : "#08091a",
                      fontSize:9, fontWeight:700, letterSpacing:2, padding:"4px 14px",
                      borderRadius:20, whiteSpace:"nowrap", fontFamily:F.mono,
                      textTransform:"uppercase",
                      boxShadow:`0 4px 16px ${p.accent}44`,
                    }}>
                      {p.badge}
                    </div>
                  )}

                  {/* Selected checkmark */}
                  {active && (
                    <div style={{
                      position:"absolute", top:14, right:14,
                      width:22, height:22, borderRadius:"50%",
                      background:p.accent, display:"flex",
                      alignItems:"center", justifyContent:"center",
                      fontSize:11, color:"#08091a", fontWeight:900,
                      boxShadow:`0 0 10px ${p.accent}88`,
                    }}>✓</div>
                  )}

                  {/* Duration label */}
                  <div style={{ fontSize:10, fontFamily:F.mono, letterSpacing:2.5,
                    color: active ? p.accent : "rgba(180,200,255,0.4)",
                    textTransform:"uppercase", marginBottom:10 }}>
                    {p.label}
                  </div>

                  {/* Price */}
                  <div style={{ marginBottom:6 }}>
                    <span style={{ fontFamily:F.orb, fontSize:isMob?32:36,
                      fontWeight:900, color:"#fff", lineHeight:1,
                      textShadow: active ? `0 0 20px ${p.accent}55` : "none" }}>
                      {BANK_INFO.currency}{p.price}
                    </span>
                  </div>

                  {/* Per-day price */}
                  <div style={{ fontSize:11, color:"rgba(180,200,255,0.35)",
                    fontFamily:F.mono, marginBottom:20 }}>
                    {BANK_INFO.currency}{Math.round(parseInt(p.price.replace(/,/g,""))/p.days).toLocaleString()} / өдөр
                  </div>

                  {/* Divider */}
                  <div style={{ height:1, background:`linear-gradient(90deg,transparent,${p.accent}44,transparent)`, marginBottom:16 }} />

                  {/* Features */}
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {p.features.map(f => (
                      <div key={f} style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ color:p.accent, fontSize:12, flexShrink:0 }}>✓</span>
                        <span style={{ fontSize:13, color: active ? "rgba(224,232,255,0.9)" : "rgba(180,200,255,0.5)",
                          fontFamily:F.raj, fontWeight:500 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div style={{ textAlign:"center" }}>
            <button onClick={() => setStep(2)} style={ctaBtn(plan.accent)}>
              {plan.label} — {BANK_INFO.currency}{plan.price} сонгох →
            </button>
            <div style={{ marginTop:12, fontSize:11, color:"rgba(180,200,255,0.3)", fontFamily:F.mono }}>
              Гэрээ байхгүй · Хүссэн үедээ цуцлах
            </div>
          </div>
        </div>
      )}

      {/* ══════════ STEP 2 — ДАНС ══════════ */}
      {step === 2 && (
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          {/* Selected plan summary */}
          <div style={{
            background:`linear-gradient(135deg,${plan.accent}12,rgba(8,9,26,0.8))`,
            border:`1px solid ${plan.accent}44`,
            borderRadius:14, padding:"16px 20px",
            display:"flex", justifyContent:"space-between", alignItems:"center",
            marginBottom:24,
          }}>
            <div>
              <div style={{ fontSize:9, fontFamily:F.mono, letterSpacing:2,
                color:plan.accent, textTransform:"uppercase", marginBottom:4 }}>
                Сонгосон төлөвлөгөө
              </div>
              <div style={{ fontFamily:F.orb, fontSize:16, fontWeight:700, color:"#fff" }}>
                {plan.label} · {BANK_INFO.currency}{plan.price}
              </div>
            </div>
            <button onClick={() => setStep(1)} style={{
              background:"transparent", border:`1px solid ${plan.accent}44`,
              color:plan.accent, padding:"5px 12px", borderRadius:6,
              cursor:"pointer", fontSize:11, fontFamily:F.mono, letterSpacing:1,
            }}>Өөрчлөх</button>
          </div>

          {/* Bank card */}
          <div style={{
            background:"linear-gradient(135deg,rgba(15,18,50,0.95),rgba(8,9,26,0.98))",
            border:"1px solid rgba(0,229,255,0.15)",
            borderRadius:20, padding:"28px 24px", marginBottom:20,
            boxShadow:"0 24px 60px rgba(0,0,0,0.5)",
            position:"relative", overflow:"hidden",
          }}>
            {/* Decorative glow */}
            <div style={{ position:"absolute", top:-40, right:-40, width:150, height:150,
              borderRadius:"50%", background:"rgba(0,229,255,0.04)", pointerEvents:"none" }} />

            <div style={{ fontSize:9, fontFamily:F.mono, letterSpacing:2.5,
              color:"rgba(0,229,255,0.4)", textTransform:"uppercase", marginBottom:20 }}>
              Шилжүүлэх дансны мэдээлэл
            </div>

            {/* Bank rows */}
            {[
              { label:"Банк",          value:BANK_INFO.bank,    field:"bank",    mono:false },
              { label:"Дансны нэр",    value:BANK_INFO.name,    field:"name",    mono:false },
              { label:"Дансны дугаар", value:BANK_INFO.account, field:"account", mono:true,  copy:true },
              { label:"Шилжүүлэх дүн", value:`${BANK_INFO.currency}${plan.price}`, field:"amount", mono:true, copy:true, highlight:true },
            ].map(({ label, value, field, mono, copy: canCopy, highlight }) => (
              <div key={field} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"13px 0",
                borderBottom:"1px solid rgba(0,229,255,0.07)",
              }}>
                <span style={{ fontSize:12, color:"rgba(180,200,255,0.4)",
                  fontFamily:F.mono, letterSpacing:0.5 }}>{label}</span>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{
                    fontSize: highlight ? 16 : 14,
                    fontFamily: mono ? F.mono : F.raj,
                    fontWeight: highlight ? 700 : 600,
                    color: highlight ? "#00e5ff" : "#fff",
                    letterSpacing: mono ? 1 : 0,
                    textShadow: highlight ? "0 0 12px rgba(0,229,255,0.4)" : "none",
                  }}>{value}</span>
                  {canCopy && (
                    <button onClick={() => copy(value.replace(/[₮,]/g,"").trim(), field)} style={{
                      background: copiedField===field ? "rgba(16,185,129,0.15)" : "rgba(0,229,255,0.06)",
                      border:`1px solid ${copiedField===field ? "rgba(16,185,129,0.4)" : "rgba(0,229,255,0.2)"}`,
                      color: copiedField===field ? "#10b981" : "rgba(0,229,255,0.6)",
                      padding:"3px 10px", borderRadius:6, cursor:"pointer",
                      fontSize:9, fontFamily:F.mono, letterSpacing:1,
                      transition:"all 0.2s", whiteSpace:"nowrap",
                    }}>
                      {copiedField===field ? "✓ Хуулагдлаа" : "Хуулах"}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Transfer description warning */}
            <div style={{
              marginTop:18, padding:"12px 14px", borderRadius:10,
              background:"rgba(0,229,255,0.05)",
              border:"1px solid rgba(0,229,255,0.15)",
            }}>
              <div style={{ fontSize:9, fontFamily:F.mono, letterSpacing:2,
                color:"rgba(0,229,255,0.5)", textTransform:"uppercase", marginBottom:6 }}>
                ⚠ Гүйлгээний утга
              </div>
              <div style={{ fontSize:13, color:"rgba(180,200,255,0.7)", fontFamily:F.raj, lineHeight:1.6 }}>
                Гүйлгээний утга хэсэгт{" "}
                <span style={{ color:"#00e5ff", fontFamily:F.mono, fontSize:12 }}>
                  "{user?.email}"
                </span>
                {" "}гэж бичнэ үү
              </div>
            </div>
          </div>

          {/* Steps guide */}
          <div style={{ marginBottom:24 }}>
            {[
              { n:"1", text:"Дансны дугаарыг хуулж авна" },
              { n:"2", text:`${BANK_INFO.currency}${plan.price} шилжүүлнэ (утга: имэйл)` },
              { n:"3", text:"Доорх хэсэгт гүйлгээний дугаарыг бичнэ" },
            ].map(({ n, text }) => (
              <div key={n} style={{ display:"flex", alignItems:"center", gap:12,
                marginBottom:10, padding:"10px 14px", borderRadius:10,
                background:"rgba(0,229,255,0.03)", border:"1px solid rgba(0,229,255,0.08)" }}>
                <div style={{ width:24, height:24, borderRadius:"50%", flexShrink:0,
                  background:"rgba(0,229,255,0.12)", border:"1px solid rgba(0,229,255,0.3)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:F.mono, fontSize:11, fontWeight:700, color:"#00e5ff" }}>
                  {n}
                </div>
                <span style={{ fontSize:13, color:"rgba(180,200,255,0.7)", fontFamily:F.raj }}>{text}</span>
              </div>
            ))}
          </div>

          <button onClick={() => setStep(3)} style={ctaBtn(plan.accent)}>
            Мөнгө шилжүүллээ →
          </button>
        </div>
      )}

      {/* ══════════ STEP 3 — БАТАЛГАА ══════════ */}
      {step === 3 && (
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          {/* Plan + icon */}
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{ fontSize:52, marginBottom:12 }}>✉</div>
            <div style={{ fontFamily:F.orb, fontSize:18, fontWeight:700,
              color:"#fff", letterSpacing:2, marginBottom:8 }}>
              Баталгаажуулах
            </div>
            <div style={{ fontSize:13, color:"rgba(180,200,255,0.5)", fontFamily:F.raj, lineHeight:1.7 }}>
              Гүйлгээний дугаар эсвэл screenshot-ийн тайлбарыг оруулна уу.
              Админ шалгаад эрхийг нээнэ.
            </div>
          </div>

          {/* Summary card */}
          <div style={{
            background:`linear-gradient(135deg,${plan.accent}10,rgba(8,9,26,0.9))`,
            border:`1px solid ${plan.accent}33`, borderRadius:14,
            padding:"16px 20px", marginBottom:20,
            display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, textAlign:"center",
          }}>
            {[
              { label:"Төлөвлөгөө", value:plan.label },
              { label:"Дүн",       value:`${BANK_INFO.currency}${plan.price}` },
              { label:"Хугацаа",   value:`${plan.days} хоног` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize:9, fontFamily:F.mono, letterSpacing:1.5,
                  color:"rgba(180,200,255,0.35)", textTransform:"uppercase", marginBottom:4 }}>
                  {label}
                </div>
                <div style={{ fontFamily:F.raj, fontWeight:700, fontSize:15, color:"#fff" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Note input */}
          <div style={{
            background:"rgba(10,12,35,0.8)", border:"1px solid rgba(0,229,255,0.15)",
            borderRadius:14, padding:"20px", marginBottom:20,
          }}>
            <div style={{ fontSize:9, fontFamily:F.mono, letterSpacing:2,
              color:"rgba(0,229,255,0.4)", textTransform:"uppercase", marginBottom:12 }}>
              Гүйлгээний мэдээлэл
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Жишээ: 2024-05-01, 9900₮, гүйлгээний дугаар: 20240501123456"
              rows={4}
              style={{
                width:"100%", boxSizing:"border-box",
                padding:"12px 14px", resize:"vertical",
                background:"rgba(0,229,255,0.04)",
                border:"1px solid rgba(0,229,255,0.15)",
                borderRadius:10, color:"#e0e8ff",
                fontSize:13, outline:"none",
                fontFamily:F.raj, lineHeight:1.6,
                transition:"border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor="rgba(0,229,255,0.4)"}
              onBlur={e => e.target.style.borderColor="rgba(0,229,255,0.15)"}
            />
            <div style={{ marginTop:8, fontSize:11, color:"rgba(180,200,255,0.3)", fontFamily:F.mono }}>
              {note.length} тэмдэгт
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={sendRequest}
            disabled={sending || !note.trim()}
            style={{
              ...ctaBtn(plan.accent),
              opacity: (sending || !note.trim()) ? 0.5 : 1,
              cursor: (sending || !note.trim()) ? "not-allowed" : "pointer",
            }}
          >
            {sending ? "Илгээж байна..." : "✓ Хүсэлт илгээх"}
          </button>

          <div style={{ textAlign:"center", marginTop:14, fontSize:11,
            color:"rgba(180,200,255,0.25)", fontFamily:F.mono, letterSpacing:1 }}>
            Ихэвчлэн 1–2 цагт баталгаажна
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Helpers ── */
function wrap(isMob) {
  return {
    maxWidth: 760, margin:"0 auto",
    padding: isMob ? "24px 16px 60px" : "40px 24px 80px",
    minHeight:"100vh",
  };
}

const pendingBox = {
  background:"rgba(10,12,35,0.8)",
  border:"1px solid rgba(0,229,255,0.15)",
  borderRadius:20, padding:"48px 32px",
  textAlign:"center",
  backdropFilter:"blur(16px)",
};

const backBtnStyle = {
  background:"rgba(0,229,255,0.05)",
  border:"1px solid rgba(0,229,255,0.18)",
  color:"rgba(0,229,255,0.7)",
  padding:"8px 18px", borderRadius:8,
  cursor:"pointer", fontSize:13,
  fontFamily:"'Rajdhani',sans-serif",
  fontWeight:600, letterSpacing:1,
  transition:"all 0.2s",
};

function ctaBtn(accent) {
  return {
    width:"100%", padding:"15px 24px",
    background:`linear-gradient(135deg,${accent},${accent}bb)`,
    border:"none", borderRadius:12,
    color: accent === "#f59e0b" ? "#08091a" : "#08091a",
    fontFamily:"'Orbitron',sans-serif",
    fontWeight:700, fontSize:14,
    letterSpacing:2, textTransform:"uppercase",
    cursor:"pointer",
    boxShadow:`0 0 32px ${accent}44`,
    transition:"all 0.2s",
  };
}

const subCss = `
  .sub-plan-card:hover {
    border-color: rgba(0,229,255,0.35) !important;
    box-shadow: 0 16px 50px rgba(0,0,0,0.6) !important;
  }
  textarea::placeholder { color: rgba(0,229,255,0.2) !important; }
  textarea:focus { outline: none; }
  button:hover { opacity: 0.88; }
  button:active { transform: scale(0.98); }
`;

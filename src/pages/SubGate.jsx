import React from "react";
import { s } from "../styles/theme";

export function SubGate({ setPage, subStatus }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh",padding:24,textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:16}}>🔒</div>
      <h2 style={{fontFamily:"'Orbitron',sans-serif",fontSize:28,color:"#00e5ff",margin:"0 0 10px",letterSpacing:2}}>
        Subscription шаардлагатай
      </h2>
      <p style={{color:"rgba(180,200,255,0.5)",fontSize:15,maxWidth:360,lineHeight:1.7,marginBottom:28}}>
        {subStatus === "pending"
          ? "Таны хүсэлт хүлээгдэж байна. Админ баталгаажуулсны дараа бүх кино харах боломжтой."
          : "Бүх кинонд нэвтрэхийн тулд subscription авна уу."}
      </p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
        <button style={s.backBtn} onClick={()=>setPage("home")}>← Буцах</button>
        {subStatus !== "pending" && (
          <button style={s.btnRed} onClick={()=>setPage("subscribe")}>Subscription авах</button>
        )}
      </div>
    </div>
  );
}

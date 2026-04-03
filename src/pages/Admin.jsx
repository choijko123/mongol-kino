import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { s } from "../styles/theme";
import { BANK_INFO, CLOUDINARY_CLOUD_NAME } from "../config/constants";
import { uploadToCloudinary } from "../services/cloudinary";
import { fetchAllSubscriptions, approveSubscription, rejectSubscription } from "../services/subscriptionService";

export function Admin({ movies, fetchMovies, showToast }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [posterFile, setPosterFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [posterPreview, setPosterPreview] = useState(null);

  function handlePoster(e) {
    const f = e.target.files[0]; if (!f) return;
    setPosterFile(f); setPosterPreview(URL.createObjectURL(f));
  }

  async function submit(e) {
    e.preventDefault();
    if (!title || !videoFile) { showToast("Гарчиг болон видео заавал шаардлагатай!", "error"); return; }
    if (CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME") {
      showToast("Cloudinary тохиргоогоо оруулна уу! (App.js дээр)", "error"); return;
    }
    setUploading(true); setProgress(0);
    try {
      let posterUrl = "";
      if (posterFile) {
        setProgressLabel("Постер байршуулж байна...");
        posterUrl = await uploadToCloudinary(posterFile, setProgress);
      }
      setProgressLabel("Видео байршуулж байна...");
      setProgress(0);
      const videoUrl = await uploadToCloudinary(videoFile, setProgress);

      await addDoc(collection(db, "movies"), {
        title, description: desc, poster: posterUrl, videoUrl, createdAt: serverTimestamp(),
      });
      showToast("Кино амжилттай нэмэгдлээ! 🎬");
      setTitle(""); setDesc(""); setPosterFile(null); setVideoFile(null); setPosterPreview(null);
      fetchMovies();
    } catch (err) {
      showToast("Upload алдаа: " + err.message, "error");
    }
    setUploading(false); setProgress(0); setProgressLabel("");
  }

  async function deleteMovie(id) {
    if (!window.confirm("Устгах уу?")) return;
    await deleteDoc(doc(db, "movies", id));
    fetchMovies(); showToast("Устгагдлаа.");
  }

  const [subRequests, setSubRequests] = React.useState([]);
  const [subLoading, setSubLoading] = React.useState(true);

  useEffect(() => {
    async function fetchSubs() {
      try {
        const snap = await getDocs(collection(db, "subscriptions"));
        setSubRequests(snap.docs.map(d => ({id:d.id, ...d.data()})));
      } catch {}
      setSubLoading(false);
    }
    fetchSubs();
  }, []);

  async function approveSub(uid) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + BANK_INFO.days);
    await updateDoc(doc(db, "subscriptions", uid), {
      status: "active",
      approvedAt: serverTimestamp(),
      expiresAt: expiry,
    });
    setSubRequests(prev => prev.map(r => r.id===uid ? {...r, status:"active", expiresAt:expiry} : r));
    showToast("Subscription батлагдлаа!");
  }

  async function rejectSub(uid) {
    await updateDoc(doc(db, "subscriptions", uid), { status: "rejected" });
    setSubRequests(prev => prev.map(r => r.id===uid ? {...r, status:"rejected"} : r));
    showToast("Татгалзлаа.");
  }

  const pending = subRequests.filter(r => r.status === "pending");
  const approved = subRequests.filter(r => r.status === "active");

  return (
    <div style={s.adminPage}>
      <h2 style={s.adminHeading}>Админ панель</h2>

      {/* Subscription хүсэлтүүд */}
      <div style={{...s.adminCard, borderColor: pending.length ? "#FF3B3B" : "#1a1a1a"}}>
        <h3 style={s.adminSubHeading}>
          Subscription хүсэлт
          {pending.length > 0 && (
            <span style={{marginLeft:10, background:"#FF3B3B", color:"#fff", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:10}}>{pending.length}</span>
          )}
        </h3>
        {subLoading && <p style={{color:"#555"}}>Ачааллаж байна...</p>}
        {!subLoading && subRequests.length === 0 && <p style={{color:"#555", fontSize:14}}>Одоогоор хүсэлт байхгүй байна.</p>}
        <div style={{display:"flex", flexDirection:"column", gap:10}}>
          {subRequests.map(r => (
            <div key={r.id} style={{
              background:"#161616", borderRadius:10, padding:"14px 16px",
              border:"1px solid " + (r.status==="pending" ? "#3a2000" : r.status==="active" ? "#0a2a0a" : "#2a0a0a"),
              display:"flex", alignItems:"center", gap:14,
            }}>
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4}}>
                  <span style={{fontSize:14, fontWeight:600, color:"#eee"}}>{r.name || r.email}</span>
                  <span style={{
                    fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                    padding:"2px 7px", borderRadius:4,
                    background: r.status==="pending" ? "rgba(255,150,0,0.15)" : r.status==="active" ? "rgba(29,185,84,0.15)" : "rgba(200,0,0,0.15)",
                    color: r.status==="pending" ? "#ffaa00" : r.status==="active" ? "#1db954" : "#e74c3c",
                  }}>{r.status==="pending" ? "Хүлээгдэж байна" : r.status==="active" ? "Идэвхтэй" : "Татгалзсан"}</span>
                </div>
                <div style={{fontSize:12, color:"#666", marginBottom:2}}>{r.email}</div>
                {r.note && <div style={{fontSize:12, color:"#888", background:"#0d0d0d", borderRadius:6, padding:"4px 8px", marginTop:4}}>💬 {r.note}</div>}
                {r.status==="active" && r.expiresAt && (
                  <div style={{fontSize:11, color:"#1db954", marginTop:4}}>
                    ✓ Дуусах: {(r.expiresAt instanceof Date ? r.expiresAt : r.expiresAt.toDate?.()).toLocaleDateString("mn-MN")}
                  </div>
                )}
              </div>
              {r.status === "pending" && (
                <div style={{display:"flex", gap:8, flexShrink:0}}>
                  <button onClick={() => approveSub(r.id)} style={{
                    background:"rgba(29,185,84,0.15)", border:"1px solid #1db954",
                    color:"#1db954", padding:"7px 16px", borderRadius:7,
                    cursor:"pointer", fontSize:13, fontFamily:"'Outfit',sans-serif", fontWeight:600,
                  }}>Батлах</button>
                  <button onClick={() => rejectSub(r.id)} style={{
                    background:"transparent", border:"1px solid #3a1010",
                    color:"#e74c3c", padding:"7px 14px", borderRadius:7,
                    cursor:"pointer", fontSize:13, fontFamily:"'Outfit',sans-serif",
                  }}>Татгалзах</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cloudinary тохиргоо анхааруулга */}
      {CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME" && (
        <div style={s.warnBox}>
          ⚠️ <strong>Cloudinary тохиргоо хийгдээгүй байна.</strong> Доорх зааврыг дагана уу.
          <ol style={{marginTop:10,paddingLeft:20,lineHeight:2}}>
            <li><a href="https://cloudinary.com" target="_blank" rel="noreferrer" style={{color:"#FF3B3B"}}>cloudinary.com</a> дээр үнэгүй бүртгүүлнэ</li>
            <li>Dashboard → <strong>Cloud name</strong> хуулна</li>
            <li>Settings → Upload → <strong>Add upload preset</strong> → Signing Mode: <strong>Unsigned</strong> → Save</li>
            <li><code style={s.code}>App.js</code> дээр <code style={s.code}>CLOUDINARY_CLOUD_NAME</code> болон <code style={s.code}>CLOUDINARY_UPLOAD_PRESET</code> утгуудыг солино</li>
          </ol>
        </div>
      )}

      <div style={s.adminCard}>
        <h3 style={s.adminSubHeading}>Шинэ кино нэмэх</h3>
        <form onSubmit={submit} style={s.adminForm}>
          <div style={s.adminRow}>
            <div style={s.adminCol}>
              <label style={s.label}>Гарчиг *</label>
              <input style={s.input} value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Киноны нэр" />
              <label style={s.label}>Тайлбар</label>
              <textarea style={{...s.input, height:80, resize:"vertical"}} value={desc} onChange={(e)=>setDesc(e.target.value)} placeholder="Киноны товч тайлбар..." />
              <label style={s.label}>Постер зураг (JPG/PNG)</label>
              <input style={s.fileInput} type="file" accept="image/*" onChange={handlePoster} />
              <label style={s.label}>Видео файл (MP4) *</label>
              <input style={s.fileInput} type="file" accept="video/*" onChange={(e)=>setVideoFile(e.target.files[0])} />
            </div>
            {posterPreview && (
              <div style={s.adminPosterPreview}>
                <img src={posterPreview} alt="preview" style={{width:"100%",borderRadius:8}} />
              </div>
            )}
          </div>

          {uploading && (
            <div style={{margin:"16px 0"}}>
              <div style={{fontSize:13,color:"#aaa",marginBottom:6}}>{progressLabel}</div>
              <div style={s.progressTrack}>
                <div style={{...s.progressBar, width:`${progress}%`}} />
              </div>
              <div style={{fontSize:13,color:"#888",marginTop:4}}>{progress}%</div>
            </div>
          )}

          <button type="submit" style={{...s.btnRed, marginTop:16}} disabled={uploading}>
            {uploading ? "Байршуулж байна..." : "⬆ Upload хийх"}
          </button>
        </form>
      </div>

      <div style={s.adminCard}>
        <h3 style={s.adminSubHeading}>Нийт кино ({movies.length})</h3>
        {movies.length === 0 && <p style={{color:"#555"}}>Кино байхгүй байна.</p>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {movies.map((m) => (
            <div key={m.id} style={s.adminMovieRow}>
              {m.poster && <img src={m.poster} alt={m.title} style={s.adminThumb} />}
              {!m.poster && <div style={{...s.adminThumb, background:"#1a1a1a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20}}>🎬</div>}
              <div style={{flex:1}}>
                <div style={s.adminMovieTitle}>{m.title}</div>
                <div style={s.adminMovieDesc}>{m.description}</div>
              </div>
              <button style={s.deleteBtn} onClick={()=>deleteMovie(m.id)}>Устгах</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


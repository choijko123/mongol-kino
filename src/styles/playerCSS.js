export const playerCSS = `
  .kt-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.88) 0%,transparent 45%); display:flex; flex-direction:column; justify-content:flex-end; transition:opacity 0.3s; }
  .kt-overlay.kt-hidden { opacity:0; pointer-events:none; }
  .kt-center-btn { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:72px; height:72px; border-radius:50%; background:rgba(0,229,255,0.12); border:1.5px solid rgba(0,229,255,0.3); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:transform 0.15s,background 0.15s; }
  .kt-center-btn:hover { transform:translate(-50%,-50%) scale(1.1); background:rgba(0,229,255,0.25); }
  .kt-controls { padding:12px 18px 16px; display:flex; flex-direction:column; gap:10px; }
  .kt-prog { position:relative; height:4px; background:rgba(255,255,255,0.15); border-radius:2px; cursor:pointer; transition:height 0.15s; }
  .kt-prog:hover { height:7px; }
  .kt-prog-buf { position:absolute; top:0; left:0; height:100%; background:rgba(255,255,255,0.22); border-radius:2px; pointer-events:none; }
  .kt-prog-fill { position:absolute; top:0; left:0; height:100%; background:linear-gradient(90deg,#00e5ff,#7c3aed); border-radius:2px; pointer-events:none; }
  .kt-prog-fill::after { content:''; position:absolute; right:-5px; top:50%; transform:translateY(-50%); width:13px; height:13px; background:#00e5ff; border-radius:50%; opacity:0; transition:opacity 0.15s; }
  .kt-prog:hover .kt-prog-fill::after { opacity:1; }
  .kt-btn { background:transparent; border:none; cursor:pointer; color:#ccc; display:flex; align-items:center; padding:4px; border-radius:4px; transition:color 0.15s; }
  .kt-btn:hover { color:#00e5ff; }
  .kt-speed { background:rgba(0,229,255,0.08); border:1px solid rgba(0,229,255,0.2); color:#00e5ff; font-size:12px; font-weight:700; padding:3px 9px; border-radius:4px; cursor:pointer; transition:background 0.15s; font-family:inherit; }
  .kt-speed:hover { background:rgba(0,229,255,0.18); }
  .kt-spinner { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:38px; height:38px; border:3px solid rgba(0,229,255,0.12); border-top-color:#00e5ff; border-radius:50%; animation:kt-spin 0.8s linear infinite; display:none; }
  @keyframes kt-spin { to { transform:translate(-50%,-50%) rotate(360deg); } }
`;

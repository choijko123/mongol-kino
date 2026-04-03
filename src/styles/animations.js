export const css = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; background: #08091a; }
  input::placeholder, textarea::placeholder { color: rgba(0,229,255,0.25); }
  input:focus, textarea:focus { border-color: rgba(0,229,255,0.5) !important; box-shadow: 0 0 0 3px rgba(0,229,255,0.08) !important; background: rgba(0,229,255,0.06) !important; }
  button:hover { opacity: 0.9; }
  button:active { transform: scale(0.97) !important; }
  button:disabled { opacity: 0.3; cursor: not-allowed; transform: none !important; }

  .kt-card-3d { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease, border-color 0.3s; }
  .kt-card-3d:hover { transform: perspective(900px) rotateY(-8deg) rotateX(4deg) scale(1.07) translateZ(16px); box-shadow: 18px 28px 60px rgba(0,0,0,0.8), -2px -2px 30px rgba(0,229,255,0.12), 0 0 0 1px rgba(0,229,255,0.3); border-color: rgba(0,229,255,0.4) !important; }

  .kt-fade-in { animation: ktFadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both; }
  .kt-fade-in:nth-child(1){animation-delay:0s} .kt-fade-in:nth-child(2){animation-delay:0.07s}
  .kt-fade-in:nth-child(3){animation-delay:0.14s} .kt-fade-in:nth-child(4){animation-delay:0.21s}
  .kt-fade-in:nth-child(5){animation-delay:0.28s} .kt-fade-in:nth-child(6){animation-delay:0.35s}
  .kt-fade-in:nth-child(7){animation-delay:0.42s} .kt-fade-in:nth-child(8){animation-delay:0.49s}
  @keyframes ktFadeUp { from { opacity:0; transform:translateY(28px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }

  .kt-shine { position:relative; overflow:hidden; }
  .kt-shine::after { content:''; position:absolute; top:-50%; left:-70%; width:35%; height:200%; background:linear-gradient(105deg,transparent,rgba(0,229,255,0.07),transparent); transform:skewX(-18deg); transition:left 0.7s ease; pointer-events:none; }
  .kt-shine:hover::after { left:130%; }

  .kt-hero-reveal { animation: ktSlideIn 1.1s cubic-bezier(0.16,1,0.3,1) both; }
  .kt-hero-title  { animation: ktSlideIn 1s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
  .kt-hero-desc   { animation: ktSlideIn 1s cubic-bezier(0.16,1,0.3,1) 0.32s both; }
  .kt-hero-btns   { animation: ktSlideIn 1s cubic-bezier(0.16,1,0.3,1) 0.46s both; }
  @keyframes ktSlideIn { from { opacity:0; transform:translateX(-36px); } to { opacity:1; transform:translateX(0); } }

  .kt-tab-active { color: #00e5ff !important; border-bottom-color: #00e5ff !important; text-shadow: 0 0 16px rgba(0,229,255,0.6); }
  .kt-auth-slide { animation: ktAuthUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  @keyframes ktAuthUp { from { opacity:0; transform:translateY(30px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }

  @keyframes ktLogoGlow { 0%,100% { text-shadow: 0 0 20px rgba(0,229,255,0.5), 0 0 40px rgba(0,229,255,0.2); } 50% { text-shadow: 0 0 40px rgba(0,229,255,0.9), 0 0 80px rgba(0,229,255,0.4), 0 0 120px rgba(124,58,237,0.3); } }
  .kt-logo-glow { animation: ktLogoGlow 2.5s ease-in-out infinite; }
  @keyframes ktFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  .kt-float { animation: ktFloat 3.5s ease-in-out infinite; }
  @keyframes ktCyanPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(0,229,255,0.5), 0 0 24px rgba(0,229,255,0.4); } 50% { box-shadow: 0 0 0 10px rgba(0,229,255,0), 0 0 40px rgba(0,229,255,0.6); } }
  .kt-btn-pulse { animation: ktCyanPulse 2s infinite; }

  nav { box-shadow: 0 1px 0 rgba(0,229,255,0.1), 0 4px 32px rgba(0,0,0,0.5); }
  .kt-toast-cyan { background: linear-gradient(135deg,#00e5ff,#0088aa) !important; color:#08091a !important; }
  .kt-toast-err  { background: linear-gradient(135deg,#7c3aed,#4c1d95) !important; color:#fff !important; }
  .kt-page-bg { background-image: linear-gradient(rgba(0,229,255,0.03) 1px,transparent 1px), linear-gradient(90deg,rgba(0,229,255,0.03) 1px,transparent 1px); background-size: 48px 48px; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.25); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,229,255,0.5); }

  @media (max-width: 639px) {
    .kt-card-3d:hover { transform: none !important; box-shadow: none !important; }
    .kt-card-3d:active { transform: scale(0.97) !important; }
    .kt-btn-pulse { animation: none; }
  }
`;

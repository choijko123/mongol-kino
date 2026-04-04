export const playerCSS = `
  /* ── Shell ── */
  .kt-shell {
    background: #000;
    position: relative;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
  }

  /* ── Gradient overlays ── */
  .kt-grad-top {
    position: absolute; top: 0; left: 0; right: 0; height: 80px;
    background: linear-gradient(to bottom, rgba(0,0,0,0.55), transparent);
    pointer-events: none; z-index: 2;
    opacity: 1; transition: opacity 0.4s;
  }
  .kt-grad-bot {
    position: absolute; bottom: 0; left: 0; right: 0; height: 140px;
    background: linear-gradient(to top, rgba(0,0,0,0.88), transparent);
    pointer-events: none; z-index: 2;
    opacity: 1; transition: opacity 0.4s;
  }
  .kt-shell.kt-idle .kt-grad-top,
  .kt-shell.kt-idle .kt-grad-bot { opacity: 0; }

  /* ── Custom cursor ── */
  .kt-cursor {
    position: absolute; width: 36px; height: 36px;
    border-radius: 50%;
    border: 1.5px solid rgba(0,229,255,0.55);
    background: rgba(0,229,255,0.08);
    transform: translate(-50%, -50%);
    pointer-events: none; z-index: 20;
    transition: opacity 0.25s, transform 0.1s;
  }
  .kt-cursor.gone { opacity: 0; }
  .kt-shell.kt-idle .kt-cursor { opacity: 0; }

  /* ── Spinner ── */
  .kt-spinner {
    position: absolute; inset: 0;
    display: none; align-items: center; justify-content: center;
    z-index: 10; pointer-events: none;
  }
  .kt-spinner-ring {
    width: 44px; height: 44px;
    border: 3px solid rgba(0,229,255,0.15);
    border-top-color: #00e5ff;
    border-radius: 50%;
    animation: kt-spin 0.75s linear infinite;
  }
  @keyframes kt-spin { to { transform: rotate(360deg); } }

  /* ── Skip zones (double-tap) ── */
  .kt-zone {
    position: absolute; top: 0; bottom: 0; width: 35%;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none; z-index: 8; opacity: 0;
    transition: opacity 0.15s;
  }
  .kt-zone.left  { left: 0; }
  .kt-zone.right { right: 0; }
  .kt-zone.show  { opacity: 1; }

  .kt-zone-ripple {
    position: absolute; inset: 0; border-radius: 0;
  }
  .kt-zone.left  .kt-zone-ripple { background: radial-gradient(ellipse at 20% 50%, rgba(0,229,255,0.18) 0%, transparent 70%); }
  .kt-zone.right .kt-zone-ripple { background: radial-gradient(ellipse at 80% 50%, rgba(0,229,255,0.18) 0%, transparent 70%); }

  .kt-zone-inner {
    display: flex; flex-direction: column; align-items: center; gap: 4;
    z-index: 1;
  }
  .kt-zone-arrows {
    font-size: 28px; color: rgba(0,229,255,0.9);
    text-shadow: 0 0 16px rgba(0,229,255,0.8);
    font-family: sans-serif; line-height: 1;
  }
  .kt-zone-label {
    font-size: 12px; color: rgba(0,229,255,0.75);
    font-family: 'Space Mono', monospace;
    letter-spacing: 1px;
  }

  /* ── Pause overlay ── */
  .kt-pause-overlay {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    z-index: 7; opacity: 0; pointer-events: none;
    transition: opacity 0.2s;
  }
  .kt-pause-overlay.show { opacity: 1; }
  .kt-pause-ring {
    width: 72px; height: 72px; border-radius: 50%;
    background: rgba(0,0,0,0.45);
    border: 1.5px solid rgba(0,229,255,0.3);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 32px rgba(0,229,255,0.15);
  }

  /* ── Center play/pause button ── */
  .kt-play-btn {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 72px; height: 72px; border-radius: 50%;
    background: rgba(0,229,255,0.15);
    border: 1.5px solid rgba(0,229,255,0.35);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 9;
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s, opacity 0.3s;
    box-shadow: 0 0 28px rgba(0,229,255,0.3);
  }
  .kt-play-btn:hover {
    transform: translate(-50%, -50%) scale(1.1);
    background: rgba(0,229,255,0.25);
  }
  .kt-play-btn.kt-hidden {
    opacity: 0; pointer-events: none;
    transform: translate(-50%, -50%) scale(0.85);
  }

  /* ── Title strip (top bar) ── */
  .kt-title-strip {
    position: absolute; top: 0; left: 0; right: 0;
    padding: 14px 18px;
    display: flex; align-items: center; gap: 10;
    z-index: 6;
    opacity: 1; transition: opacity 0.4s;
  }
  .kt-shell.kt-idle .kt-title-strip { opacity: 0; }
  .kt-genre-badge {
    font-size: 9px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; font-family: 'Space Mono', monospace;
    color: #00e5ff; background: rgba(0,229,255,0.12);
    border: 1px solid rgba(0,229,255,0.3);
    padding: 3px 8px; border-radius: 4px; flex-shrink: 0;
  }
  .kt-title-text {
    font-family: 'Orbitron', sans-serif; font-size: 13px;
    font-weight: 700; color: rgba(255,255,255,0.75);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    letter-spacing: 1px;
  }

  /* ── Controls bar ── */
  .kt-controls {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 0 16px 14px; z-index: 6;
    opacity: 1; transition: opacity 0.4s;
  }
  .kt-shell.kt-idle .kt-controls { opacity: 0; pointer-events: none; }

  /* ── Progress bar ── */
  .kt-prog-wrap {
    position: relative; padding: 10px 0 6px; cursor: pointer;
    touch-action: none;
  }
  .kt-prog-track {
    height: 3px; background: rgba(255,255,255,0.18);
    border-radius: 2px; position: relative;
    transition: height 0.15s;
  }
  .kt-prog-wrap:hover .kt-prog-track,
  .kt-prog-wrap.dragging .kt-prog-track { height: 6px; }

  .kt-prog-buf {
    position: absolute; top: 0; left: 0; height: 100%;
    background: rgba(255,255,255,0.25); border-radius: 2px;
    pointer-events: none;
  }
  .kt-prog-fill {
    position: absolute; top: 0; left: 0; height: 100%;
    background: linear-gradient(90deg, #00e5ff, #7c3aed);
    border-radius: 2px; pointer-events: none;
  }
  .kt-prog-thumb {
    position: absolute; right: -5px; top: 50%;
    transform: translateY(-50%);
    width: 12px; height: 12px; border-radius: 50%;
    background: #00e5ff; opacity: 0;
    transition: opacity 0.15s;
    box-shadow: 0 0 8px rgba(0,229,255,0.8);
  }
  .kt-prog-wrap:hover .kt-prog-thumb,
  .kt-prog-wrap.dragging .kt-prog-thumb { opacity: 1; }

  /* Hover time tooltip */
  .kt-prog-tip {
    position: absolute; top: -28px;
    transform: translateX(-50%);
    background: rgba(8,9,26,0.9);
    border: 1px solid rgba(0,229,255,0.25);
    color: #e0e8ff; font-size: 11px;
    font-family: 'Space Mono', monospace;
    padding: 2px 7px; border-radius: 5px;
    pointer-events: none; white-space: nowrap;
    opacity: 0; transition: opacity 0.15s;
  }
  .kt-prog-wrap:hover .kt-prog-tip { opacity: 1; }

  /* ── Button row ── */
  .kt-btn-row {
    display: flex; align-items: center; gap: 6px;
    margin-top: 4px;
  }
  .kt-btn {
    background: transparent; border: none;
    color: rgba(220,235,255,0.8); cursor: pointer;
    padding: 6px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    transition: color 0.15s, background 0.15s;
    position: relative;
  }
  .kt-btn:hover { color: #00e5ff; background: rgba(0,229,255,0.08); }

  .kt-btn.skip { position: relative; }
  .kt-skip-num { font-size: 7px !important; }

  /* ── Time display ── */
  .kt-time {
    font-size: 12px; color: rgba(200,215,255,0.65);
    font-family: 'Space Mono', monospace;
    white-space: nowrap; padding: 0 4px;
    letter-spacing: 0.5px;
  }
  .kt-time b { color: #fff; font-weight: 700; }

  /* ── Volume group ── */
  .kt-vol-group {
    display: flex; align-items: center; gap: 2px;
  }
  .kt-vol-slider {
    width: 0; overflow: hidden;
    transition: width 0.25s cubic-bezier(0.16,1,0.3,1);
  }
  .kt-vol-group:hover .kt-vol-slider { width: 72px; }
  .kt-vol-slider input[type=range] {
    width: 68px; height: 3px; accent-color: #00e5ff;
    cursor: pointer; display: block;
    margin: 0 4px;
  }

  /* ── Speed button ── */
  .kt-speed {
    background: rgba(0,229,255,0.07);
    border: 1px solid rgba(0,229,255,0.18);
    color: rgba(180,200,255,0.7);
    font-size: 11px; font-weight: 700;
    font-family: 'Space Mono', monospace;
    padding: 4px 9px; border-radius: 5px;
    cursor: pointer; letter-spacing: 0.5px;
    transition: all 0.2s;
  }
  .kt-speed:hover,
  .kt-speed.active {
    background: rgba(0,229,255,0.15);
    border-color: rgba(0,229,255,0.45);
    color: #00e5ff;
  }

  /* ── Fullscreen icons ── */
  .kt-fs-icon-exit { display: none; }
  .kt-shell.kt-fs .kt-fs-icon-enter { display: none; }
  .kt-shell.kt-fs .kt-fs-icon-exit  { display: block; }

  /* ── Fullscreen shell ── */
  .kt-shell:-webkit-full-screen,
  .kt-shell:fullscreen {
    border-radius: 0 !important;
  }

  /* ── Mobile touch feedback ── */
  @media (max-width: 639px) {
    .kt-play-btn { width: 60px; height: 60px; }
    .kt-controls { padding: 0 12px 12px; }
    .kt-btn { padding: 5px; }
    .kt-vol-group:hover .kt-vol-slider { width: 60px; }
    .kt-time { font-size: 11px; }
    .kt-title-text { font-size: 11px; }
  }

  /* ── Back button ── */
  button[style*="backBtn"] {
    transition: all 0.2s;
  }
`;
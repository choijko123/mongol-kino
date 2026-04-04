export const playerCSS = `
  /* ── Base ─────────────────────────────────────────────── */
  .kt-shell {
    position: relative;
    background: #000;
    overflow: hidden;
    cursor: none;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    border-radius: 12px;
  }
  .kt-shell.kt-fs { border-radius: 0; }
  .kt-shell * { box-sizing: border-box; }

  /* ── Custom cursor (desktop only) ────────────────────── */
  .kt-cursor {
    position: absolute;
    width: 8px; height: 8px;
    background: rgba(255,255,255,0.9);
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%,-50%);
    transition: width 0.2s, height 0.2s, opacity 0.3s;
    z-index: 99;
    mix-blend-mode: difference;
  }
  .kt-cursor.big { width: 36px; height: 36px; }
  .kt-cursor.gone { opacity: 0; }

  /* ── Cinematic gradient overlays ────────────────────── */
  .kt-grad-top {
    position: absolute; inset: 0 0 auto 0; height: 120px;
    background: linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%);
    pointer-events: none; z-index: 5;
    opacity: 0; transition: opacity 0.35s ease;
  }
  .kt-grad-bot {
    position: absolute; inset: auto 0 0 0; height: 240px;
    background: linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 35%, transparent 100%);
    pointer-events: none; z-index: 5;
    opacity: 0; transition: opacity 0.35s ease;
  }
  .kt-shell:not(.kt-idle) .kt-grad-top,
  .kt-shell:not(.kt-idle) .kt-grad-bot { opacity: 1; }

  /* ── Loading spinner ────────────────────────────────── */
  .kt-spinner {
    position: absolute; inset: 0;
    display: none; align-items: center; justify-content: center;
    z-index: 10; pointer-events: none;
  }
  .kt-spinner-ring {
    width: 48px; height: 48px;
    border: 2.5px solid rgba(255,255,255,0.08);
    border-top-color: #E50914;
    border-radius: 50%;
    animation: kt-spin 0.75s cubic-bezier(0.4,0,0.6,1) infinite;
  }
  @keyframes kt-spin { to { transform: rotate(360deg); } }

  /* ── Tap-to-skip ripple zones ───────────────────────── */
  .kt-zone {
    position: absolute; top: 0; bottom: 0; width: 35%;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none; z-index: 18;
  }
  .kt-zone.left  { left: 0; }
  .kt-zone.right { right: 0; }
  .kt-zone-inner {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    opacity: 0; transform: scale(0.8);
    transition: opacity 0.12s, transform 0.12s;
  }
  .kt-zone.show .kt-zone-inner { opacity: 1; transform: scale(1); }
  .kt-zone-ripple {
    position: absolute; inset: 0;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
    transform: scale(0); opacity: 1;
    transition: transform 0.5s ease-out, opacity 0.5s ease-out;
  }
  .kt-zone.show .kt-zone-ripple { transform: scale(1.4); opacity: 0; }
  .kt-zone-arrows { font-size: 20px; letter-spacing: -6px; color: rgba(255,255,255,0.9); }
  .kt-zone-label {
    font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 500;
    color: rgba(255,255,255,0.75); letter-spacing: 0.5px;
  }

  /* ── Center play/pause button ───────────────────────── */
  .kt-play-btn {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%,-50%);
    width: 80px; height: 80px; border-radius: 50%;
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1.5px solid rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 20;
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1),
                background 0.2s, opacity 0.3s;
  }
  .kt-play-btn:hover {
    transform: translate(-50%,-50%) scale(1.12);
    background: rgba(255,255,255,0.18);
  }
  .kt-play-btn.kt-hidden { opacity: 0; pointer-events: none; }

  /* ── Паused big indicator ───────────────────────────── */
  .kt-pause-overlay {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none; z-index: 15;
    opacity: 0; transition: opacity 0.25s;
  }
  .kt-pause-overlay.show { opacity: 1; }
  .kt-pause-ring {
    width: 70px; height: 70px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
    animation: kt-pulse-ring 1.8s ease-in-out infinite;
  }
  @keyframes kt-pulse-ring {
    0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.15); }
    50%      { box-shadow: 0 0 0 16px rgba(255,255,255,0); }
  }

  /* ── Controls bar ────────────────────────────────────── */
  .kt-controls {
    position: absolute; inset: auto 0 0 0;
    padding: 0 20px 18px;
    display: flex; flex-direction: column; gap: 10px;
    z-index: 25;
    opacity: 0; transform: translateY(8px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none;
  }
  .kt-shell:not(.kt-idle) .kt-controls {
    opacity: 1; transform: translateY(0); pointer-events: auto;
  }

  /* ── Progress track ─────────────────────────────────── */
  .kt-prog-wrap {
    position: relative;
    height: 18px; display: flex; align-items: center;
    cursor: pointer;
    touch-action: none;
  }
  .kt-prog-track {
    position: relative; width: 100%; height: 3px;
    background: rgba(255,255,255,0.18);
    border-radius: 2px;
    transition: height 0.2s ease;
    overflow: visible;
  }
  .kt-prog-wrap:hover .kt-prog-track,
  .kt-prog-wrap.dragging .kt-prog-track { height: 5px; }
  .kt-prog-buf {
    position: absolute; top: 0; left: 0; height: 100%;
    background: rgba(255,255,255,0.25); border-radius: 2px;
    pointer-events: none;
  }
  .kt-prog-fill {
    position: absolute; top: 0; left: 0; height: 100%;
    background: #E50914; border-radius: 2px;
    pointer-events: none; transition: width 0.05s;
  }
  .kt-prog-thumb {
    position: absolute; top: 50%; right: -6px;
    width: 14px; height: 14px; border-radius: 50%;
    background: #fff; transform: translateY(-50%) scale(0);
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
    pointer-events: none; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  }
  .kt-prog-wrap:hover .kt-prog-thumb,
  .kt-prog-wrap.dragging .kt-prog-thumb { transform: translateY(-50%) scale(1); }

  /* Tooltip */
  .kt-prog-tip {
    position: absolute; bottom: 20px;
    background: rgba(20,20,20,0.95);
    color: #fff; font-family: 'Outfit', sans-serif;
    font-size: 12px; font-weight: 500;
    padding: 4px 8px; border-radius: 4px;
    white-space: nowrap; pointer-events: none;
    opacity: 0; transition: opacity 0.15s;
    transform: translateX(-50%);
  }
  .kt-prog-wrap:hover .kt-prog-tip { opacity: 1; }

  /* ── Button row ─────────────────────────────────────── */
  .kt-btn-row {
    display: flex; align-items: center; gap: 4px;
  }
  .kt-btn {
    background: transparent; border: none;
    color: rgba(255,255,255,0.85); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    width: 42px; height: 42px; border-radius: 50%;
    transition: color 0.15s, background 0.15s, transform 0.15s;
    flex-shrink: 0;
  }
  .kt-btn:hover {
    color: #fff;
    background: rgba(255,255,255,0.1);
    transform: scale(1.1);
  }
  .kt-btn:active { transform: scale(0.95); }

  /* Skip buttons special */
  .kt-btn.skip { position: relative; }
  .kt-btn.skip .kt-skip-num {
    position: absolute;
    font-family: 'Outfit', sans-serif;
    font-size: 8px; font-weight: 700;
    line-height: 1; letter-spacing: 0;
    top: 55%; left: 50%;
    transform: translate(-50%, -50%);
    color: currentColor;
  }

  /* ── Volume group ───────────────────────────────────── */
  .kt-vol-group {
    display: flex; align-items: center; gap: 4px;
    overflow: hidden;
  }
  .kt-vol-slider {
    width: 0; opacity: 0;
    transition: width 0.25s ease, opacity 0.25s ease;
  }
  .kt-vol-group:hover .kt-vol-slider,
  .kt-vol-group:focus-within .kt-vol-slider {
    width: 72px; opacity: 1;
  }
  .kt-vol-slider input {
    width: 72px; height: 3px;
    -webkit-appearance: none; appearance: none;
    background: transparent; cursor: pointer;
    outline: none;
  }
  .kt-vol-slider input::-webkit-slider-runnable-track {
    height: 3px; border-radius: 2px;
    background: rgba(255,255,255,0.25);
  }
  .kt-vol-slider input::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px; height: 12px;
    border-radius: 50%; background: #fff;
    margin-top: -4.5px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  }
  .kt-vol-slider input::-moz-range-track {
    height: 3px; border-radius: 2px;
    background: rgba(255,255,255,0.25);
  }
  .kt-vol-slider input::-moz-range-thumb {
    border: none; width: 12px; height: 12px;
    border-radius: 50%; background: #fff;
  }

  /* ── Time display ───────────────────────────────────── */
  .kt-time {
    font-family: 'Outfit', sans-serif;
    font-size: 13px; font-weight: 400;
    color: rgba(255,255,255,0.75);
    white-space: nowrap;
    letter-spacing: 0.3px;
    padding: 0 6px;
  }
  .kt-time b { color: #fff; font-weight: 600; }

  /* ── Speed pill ─────────────────────────────────────── */
  .kt-speed {
    font-family: 'Outfit', sans-serif;
    font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,0.75);
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    padding: 4px 10px; border-radius: 4px;
    cursor: pointer; letter-spacing: 0.3px;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .kt-speed:hover { background: rgba(255,255,255,0.16); color: #fff; }
  .kt-speed.active { background: #E50914; border-color: #E50914; color: #fff; }

  /* ── Title strip (top-left when idle mode off) ──────── */
  .kt-title-strip {
    position: absolute; top: 0; left: 0; right: 0;
    padding: 16px 20px;
    display: flex; align-items: center; gap: 12px;
    z-index: 20;
    opacity: 0; transform: translateY(-6px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none;
  }
  .kt-shell:not(.kt-idle) .kt-title-strip {
    opacity: 1; transform: translateY(0);
  }
  .kt-title-text {
    font-family: 'Outfit', sans-serif;
    font-size: 15px; font-weight: 600;
    color: rgba(255,255,255,0.9);
    text-shadow: 0 1px 8px rgba(0,0,0,0.6);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .kt-genre-badge {
    font-family: 'Outfit', sans-serif;
    font-size: 10px; font-weight: 700;
    color: #E50914; background: rgba(229,9,20,0.12);
    border: 1px solid rgba(229,9,20,0.3);
    padding: 2px 8px; border-radius: 3px;
    text-transform: uppercase; letter-spacing: 1px;
    flex-shrink: 0;
  }

  /* ── Fullscreen icon swap ───────────────────────────── */
  .kt-fs-icon-enter { display: block; }
  .kt-fs-icon-exit  { display: none; }
  .kt-shell.kt-fs .kt-fs-icon-enter { display: none; }
  .kt-shell.kt-fs .kt-fs-icon-exit  { display: block; }

  /* ── Mobile adjustments ─────────────────────────────── */
  @media (max-width: 639px) {
    .kt-play-btn { width: 64px; height: 64px; }
    .kt-btn { width: 38px; height: 38px; }
    .kt-controls { padding: 0 12px 14px; gap: 8px; }
    .kt-time { font-size: 11px; }
    .kt-speed { font-size: 11px; padding: 3px 8px; }
    .kt-vol-group:hover .kt-vol-slider { width: 0; opacity: 0; }
    .kt-title-text { font-size: 13px; }
  }
`;
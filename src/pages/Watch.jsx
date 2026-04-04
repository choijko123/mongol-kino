import React from "react";
import { s } from "../styles/theme";
import { playerCSS } from "../styles/playerCSS";
import { useWindowWidth } from "../hooks/useWindowWidth";

export function Watch({ movie, setPage }) {
  const w = useWindowWidth();
  const isMob = w < 640;
  const px = isMob ? 14 : 32;

  const vidRef     = React.useRef(null);
  const shellRef   = React.useRef(null);
  const fillRef    = React.useRef(null);
  const buffRef    = React.useRef(null);
  const progWrap   = React.useRef(null);
  const progTip    = React.useRef(null);
  const spinnerRef = React.useRef(null);
  const timeRef    = React.useRef(null);
  const cursorRef  = React.useRef(null);
  const zoneLeft   = React.useRef(null);
  const zoneRight  = React.useRef(null);
  const hideTimer  = React.useRef(null);
  const isDragging = React.useRef(false);

  const [playing, setPlaying] = React.useState(false);
  const [muted,   setMuted]   = React.useState(false);
  const [vol,     setVol]     = React.useState(1);
  const [speed,   setSpeed]   = React.useState(1);
  const [isFS,    setIsFS]    = React.useState(false);
  const [idle,    setIdle]    = React.useState(true);
  const [paused,  setPaused]  = React.useState(false);
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  function fmt(sec) {
    sec = Math.floor(sec || 0);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${m}:${String(s).padStart(2,'0')}`;
  }

  function showControls() {
    setIdle(false);
    shellRef.current?.classList.remove('kt-idle');
    clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => {
        setIdle(true);
        shellRef.current?.classList.add('kt-idle');
        if (cursorRef.current) cursorRef.current.className = 'kt-cursor gone';
      }, 3200);
    }
  }

  function togglePlay() {
    const v = vidRef.current; if (!v) return;
    v.paused ? v.play() : v.pause();
    showControls();
  }

  function skip(sec) {
    const v = vidRef.current; if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration||0, v.currentTime + sec));
  }

  function flashZone(side) {
    const el = side === 'left' ? zoneLeft.current : zoneRight.current;
    if (!el) return;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 500);
  }

  function handleVolChange(val) {
    const v = vidRef.current; if (!v) return;
    v.volume = val; v.muted = val === 0;
    setVol(val); setMuted(val === 0);
  }

  function toggleMute() {
    const v = vidRef.current; if (!v) return;
    v.muted = !v.muted; setMuted(v.muted);
  }

  function cycleSpeed() {
    const v = vidRef.current; if (!v) return;
    const idx = (speeds.indexOf(speed) + 1) % speeds.length;
    v.playbackRate = speeds[idx]; setSpeed(speeds[idx]);
  }

  function toggleFS() {
    const shell = shellRef.current;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (shell.requestFullscreen) shell.requestFullscreen();
      else if (shell.webkitRequestFullscreen) shell.webkitRequestFullscreen();
      if (screen.orientation?.lock) screen.orientation.lock("landscape").catch(()=>{});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      if (screen.orientation?.unlock) screen.orientation.unlock();
    }
  }

  function seekTo(clientX) {
    const v = vidRef.current;
    const wrap = progWrap.current;
    if (!v || !wrap) return;
    const r = wrap.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    v.currentTime = pct * (v.duration || 0);
    if (fillRef.current) fillRef.current.style.width = (pct * 100) + '%';
  }

  function handleProgMouseMove(e) {
    if (isDragging.current) seekTo(e.clientX);
    const wrap = progWrap.current;
    const tip  = progTip.current;
    const v    = vidRef.current;
    if (!wrap || !tip || !v || !v.duration) return;
    const r = wrap.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    tip.textContent = fmt(pct * v.duration);
    tip.style.left = (pct * 100) + '%';
  }

  const lastTap = React.useRef(0);
  const tapTimer = React.useRef(null);

  function handleTouchTap(e) {
    showControls();
    const now = Date.now();
    const diff = now - lastTap.current;
    if (diff < 280 && diff > 0) {
      clearTimeout(tapTimer.current);
      const shell = shellRef.current;
      if (!shell) return;
      const rect = shell.getBoundingClientRect();
      const tapX = (e.touches?.[0] || e).clientX - rect.left;
      if (tapX < rect.width / 2) { skip(-10); flashZone('left'); }
      else                        { skip(10);  flashZone('right'); }
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      tapTimer.current = setTimeout(() => { togglePlay(); }, 200);
    }
  }

  function handleMouseMove(e) {
    showControls();
    const shell = shellRef.current;
    const cur   = cursorRef.current;
    if (!shell || !cur || isMob) return;
    const r = shell.getBoundingClientRect();
    cur.style.left = (e.clientX - r.left) + 'px';
    cur.style.top  = (e.clientY - r.top)  + 'px';
    cur.className = 'kt-cursor';
  }

  React.useEffect(() => {
    const v = vidRef.current; if (!v) return;
    const onPlay = () => { setPlaying(true); setPaused(false); showControls(); };
    const onPause = () => {
      setPlaying(false); setPaused(true); setIdle(false);
      shellRef.current?.classList.remove('kt-idle');
      clearTimeout(hideTimer.current);
    };
    const onTimeUpdate = () => {
      if (!v.duration) return;
      const pct = v.currentTime / v.duration;
      if (fillRef.current) fillRef.current.style.width = (pct * 100) + '%';
      if (timeRef.current)
        timeRef.current.innerHTML = `<b>${fmt(v.currentTime)}</b> / ${fmt(v.duration)}`;
    };
    const onProgress = () => {
      if (v.buffered.length && v.duration && buffRef.current)
        buffRef.current.style.width =
          (v.buffered.end(v.buffered.length - 1) / v.duration * 100) + '%';
    };
    const onWaiting = () => { if (spinnerRef.current) spinnerRef.current.style.display = 'flex'; };
    const onCanPlay = () => { if (spinnerRef.current) spinnerRef.current.style.display = 'none'; };
    const onEnded   = () => { setPlaying(false); setPaused(false); setIdle(false); shellRef.current?.classList.remove('kt-idle'); };

    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('progress', onProgress);
    v.addEventListener('waiting', onWaiting);
    v.addEventListener('playing', onCanPlay);
    v.addEventListener('canplay', onCanPlay);
    v.addEventListener('ended', onEnded);

    const onKey = (e) => {
      if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowRight' || e.key === 'l') { skip(10);  flashZone('right'); showControls(); }
      if (e.key === 'ArrowLeft'  || e.key === 'j') { skip(-10); flashZone('left');  showControls(); }
      if (e.key === 'f') toggleFS();
      if (e.key === 'm') toggleMute();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      v.removeEventListener('play', onPlay); v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTimeUpdate); v.removeEventListener('progress', onProgress);
      v.removeEventListener('waiting', onWaiting); v.removeEventListener('playing', onCanPlay);
      v.removeEventListener('canplay', onCanPlay); v.removeEventListener('ended', onEnded);
      document.removeEventListener('keydown', onKey);
    };
  }, [playing, vol]);

  React.useEffect(() => {
    function onChange() {
      const inFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFS(inFS);
      shellRef.current?.classList.toggle('kt-fs', inFS);
      if (!inFS && screen.orientation?.unlock) screen.orientation.unlock();
    }
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  React.useEffect(() => {
    function onUp() { isDragging.current = false; progWrap.current?.classList.remove('dragging'); }
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', handleProgMouseMove);
    return () => { window.removeEventListener('mouseup', onUp); window.removeEventListener('mousemove', handleProgMouseMove); };
  }, []);

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', background: '#09090b', minHeight: '100vh', paddingBottom: 48 }}>
      <style>{playerCSS}</style>

      <div style={{ padding: `20px ${px}px 0` }}>
        <button style={s.backBtn} onClick={() => setPage("home")}>← Буцах</button>
      </div>

      <div style={{ padding: `16px ${px}px 18px` }}>
        {movie.genre && (
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: '#E50914',
            textTransform: 'uppercase', marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
            {movie.genre}
          </div>
        )}
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isMob ? 30 : 38,
          letterSpacing: 1.5, margin: '0 0 8px', color: '#fff', lineHeight: 1.1 }}>
          {movie.title}
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7,
          margin: 0, fontFamily: "'Outfit', sans-serif", maxWidth: 600 }}>
          {movie.description}
        </p>
      </div>

      <div style={{ margin: `0 ${isMob ? 0 : px}px`, borderRadius: isMob ? 0 : 12,
        overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)' }}>

        <div
          ref={shellRef}
          className="kt-shell kt-idle"
          style={{ aspectRatio: '16/9', position: 'relative' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            if (cursorRef.current) cursorRef.current.className = 'kt-cursor gone';
            if (playing) { setIdle(true); shellRef.current?.classList.add('kt-idle'); }
          }}
          onClick={isMob ? undefined : togglePlay}
          onTouchStart={isMob ? handleTouchTap : undefined}
        >
          {!isMob && <div ref={cursorRef} className="kt-cursor gone" />}

          <video
            ref={vidRef}
            src={movie.videoUrl}
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
            playsInline
            webkit-playsinline="true"
            x5-playsinline="true"
            x5-video-player-type="h5"
            preload="metadata"
          />

          <div className="kt-grad-top" />
          <div className="kt-grad-bot" />

          <div ref={spinnerRef} className="kt-spinner">
            <div className="kt-spinner-ring" />
          </div>

          <div ref={zoneLeft} className="kt-zone left">
            <div className="kt-zone-ripple" />
            <div className="kt-zone-inner">
              <div className="kt-zone-arrows">‹‹</div>
              <div className="kt-zone-label">10 сек</div>
            </div>
          </div>
          <div ref={zoneRight} className="kt-zone right">
            <div className="kt-zone-ripple" />
            <div className="kt-zone-inner">
              <div className="kt-zone-arrows">››</div>
              <div className="kt-zone-label">10 сек</div>
            </div>
          </div>

          <div className={`kt-pause-overlay${paused ? ' show' : ''}`}>
            <div className="kt-pause-ring">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="rgba(255,255,255,0.6)">
                <rect x="5" y="4" width="6" height="20" rx="1.5"/>
                <rect x="17" y="4" width="6" height="20" rx="1.5"/>
              </svg>
            </div>
          </div>

          <div
            className={`kt-play-btn${idle && playing ? ' kt-hidden' : ''}`}
            onClick={(e) => { e.stopPropagation(); togglePlay(); showControls(); }}
            onTouchStart={(e) => { e.stopPropagation(); }}
          >
            {playing
              ? <svg width="28" height="28" viewBox="0 0 28 28" fill="white"><rect x="5" y="4" width="6" height="20" rx="1.5"/><rect x="17" y="4" width="6" height="20" rx="1.5"/></svg>
              : <svg width="28" height="28" viewBox="0 0 28 28" fill="white"><polygon points="8,4 24,14 8,24"/></svg>
            }
          </div>

          <div className="kt-title-strip">
            {movie.genre && <span className="kt-genre-badge">{movie.genre}</span>}
            <span className="kt-title-text">{movie.title}</span>
          </div>

          <div className="kt-controls" onClick={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
            <div
              ref={progWrap}
              className="kt-prog-wrap"
              onClick={e => seekTo(e.clientX)}
              onTouchStart={e => { e.preventDefault(); seekTo(e.touches[0].clientX); }}
              onTouchMove={e => { e.preventDefault(); seekTo(e.touches[0].clientX); }}
              onMouseDown={() => { isDragging.current = true; progWrap.current?.classList.add('dragging'); }}
            >
              <div className="kt-prog-track">
                <div ref={buffRef} className="kt-prog-buf" style={{ width: '0%' }} />
                <div ref={fillRef} className="kt-prog-fill" style={{ width: '0%' }}>
                  <div className="kt-prog-thumb" />
                </div>
              </div>
              <div ref={progTip} className="kt-prog-tip">0:00</div>
            </div>

            <div className="kt-btn-row">
              <button className="kt-btn" onClick={togglePlay}>
                {playing
                  ? <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><rect x="4" y="3" width="4" height="14" rx="1"/><rect x="12" y="3" width="4" height="14" rx="1"/></svg>
                  : <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><polygon points="5,3 17,10 5,17"/></svg>
                }
              </button>

              <button className="kt-btn skip" onClick={() => { skip(-10); flashZone('left'); }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 3C6.13 3 3 6.13 3 10s3.13 7 7 7 7-3.13 7-7"/>
                  <path d="M10 3L7 6l3 3"/>
                </svg>
                <span className="kt-skip-num" style={{top:'52%',left:'50%',transform:'translate(-50%,-50%)',position:'absolute',fontSize:7,fontWeight:700,fontFamily:'sans-serif',color:'currentColor'}}>10</span>
              </button>

              <button className="kt-btn skip" onClick={() => { skip(10); flashZone('right'); }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 3c3.87 0 7 3.13 7 7s-3.13 7-7 7-7-3.13-7-7"/>
                  <path d="M10 3l3 3-3 3"/>
                </svg>
                <span className="kt-skip-num" style={{top:'52%',left:'50%',transform:'translate(-50%,-50%)',position:'absolute',fontSize:7,fontWeight:700,fontFamily:'sans-serif',color:'currentColor'}}>10</span>
              </button>

              <span ref={timeRef} className="kt-time">0:00 / 0:00</span>
              <div style={{ flex: 1 }} />

              <div className="kt-vol-group">
                <button className="kt-btn" onClick={toggleMute}>
                  {muted || vol === 0
                    ? <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><polygon points="4,7 8,7 13,3 13,17 8,13 4,13"/><line x1="16" y1="7" x2="16" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/></svg>
                    : <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><polygon points="4,7 8,7 13,3 13,17 8,13 4,13" fill="currentColor" stroke="none"/><path d="M15 7c1.3 1 1.3 5 0 6"/><path d="M17 5c2.3 2 2.3 8 0 10"/></svg>
                  }
                </button>
                <div className="kt-vol-slider">
                  <input type="range" min="0" max="1" step="0.02"
                    value={muted ? 0 : vol}
                    onChange={e => handleVolChange(parseFloat(e.target.value))} />
                </div>
              </div>

              <button className={`kt-speed${speed !== 1 ? ' active' : ''}`} onClick={cycleSpeed}>
                {speed}×
              </button>

              <button className="kt-btn" onClick={(e) => { e.stopPropagation(); toggleFS(); }}>
                <svg className="kt-fs-icon-enter" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M2 6V2h4M12 2h4v4M16 12v4h-4M6 16H2v-4"/>
                </svg>
                <svg className="kt-fs-icon-exit" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M6 2v4H2M16 6h-4V2M12 16v-4h4M2 12h4v4"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: `20px ${px}px 0`, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ background: 'rgba(229,9,20,0.08)', border: '1px solid rgba(229,9,20,0.2)',
          borderRadius: 6, padding: '5px 12px', fontFamily: "'Outfit', sans-serif",
          fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
          HD · {movie.genre || 'Кино'}
        </div>
        {isMob && (
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            Хоёр удаа дарж 10 сек алгасна
          </div>
        )}
      </div>
    </div>
  );
}

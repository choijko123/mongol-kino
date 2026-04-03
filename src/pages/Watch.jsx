import React from "react";
import { s } from "../styles/theme";
import { playerCSS } from "../styles/playerCSS";
import { useWindowWidth } from "../hooks/useWindowWidth";

export function Watch({ movie, setPage }) {
  const w = useWindowWidth();
  const isMob = w < 640;
  const px = isMob ? 16 : 32;
  const vidRef = React.useRef(null);
  const shellRef = React.useRef(null);
  const fillRef = React.useRef(null);
  const buffRef = React.useRef(null);
  const overlayRef = React.useRef(null);
  const centerRef = React.useRef(null);
  const spinnerRef = React.useRef(null);
  const timeRef = React.useRef(null);
  const playIconRef = React.useRef(null);
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [vol, setVol] = React.useState(1);
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const hideTimer = React.useRef(null);

  function fmt(s) {
    s = Math.floor(s || 0);
    const m = Math.floor(s / 60), sec = s % 60;
    return m + ':' + String(sec).padStart(2,'0');
  }
  function togglePlay() {
    const v = vidRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  }
  function skip(s) {
    const v = vidRef.current; if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration||0, v.currentTime + s));
  }
  function handleVolChange(val) {
    const v = vidRef.current; if (!v) return;
    v.volume = val; v.muted = val == 0;
    setVol(val); setMuted(val == 0);
  }
  function toggleMute() {
    const v = vidRef.current; if (!v) return;
    v.muted = !v.muted; setMuted(v.muted);
  }
  function cycleSpeed() {
    const v = vidRef.current; if (!v) return;
    const idx = (speeds.indexOf(speed) + 1) % speeds.length;
    const ns = speeds[idx]; v.playbackRate = ns; setSpeed(ns);
  }
  function toggleFS() {
    if (!document.fullscreenElement) shellRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }
  function showOverlay() {
    overlayRef.current?.classList.remove('kt-hidden');
    clearTimeout(hideTimer.current);
    if (playing) hideTimer.current = setTimeout(() => overlayRef.current?.classList.add('kt-hidden'), 2500);
  }

  React.useEffect(() => {
    const v = vidRef.current; if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      if (!v.duration) return;
      if (fillRef.current) fillRef.current.style.width = (v.currentTime / v.duration * 100) + '%';
      if (timeRef.current) timeRef.current.textContent = fmt(v.currentTime) + ' / ' + fmt(v.duration);
    };
    const onProgress = () => {
      if (v.buffered.length && v.duration && buffRef.current)
        buffRef.current.style.width = (v.buffered.end(v.buffered.length-1) / v.duration * 100) + '%';
    };
    const onWaiting = () => { if (spinnerRef.current) spinnerRef.current.style.display='block'; };
    const onPlaying = () => { if (spinnerRef.current) spinnerRef.current.style.display='none'; };
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('progress', onProgress);
    v.addEventListener('waiting', onWaiting);
    v.addEventListener('playing', onPlaying);
    const onKey = (e) => {
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowRight') skip(10);
      if (e.key === 'ArrowLeft') skip(-10);
      if (e.key === 'f') toggleFS();
      if (e.key === 'm') toggleMute();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      v.removeEventListener('play', onPlay); v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTimeUpdate); v.removeEventListener('progress', onProgress);
      v.removeEventListener('waiting', onWaiting); v.removeEventListener('playing', onPlaying);
      document.removeEventListener('keydown', onKey);
    };
  }, [playing]);

  const psBase = {
    position:'relative', background:'#000', margin:`16px ${px}px 0`,
    borderRadius:16, overflow:'hidden', aspectRatio:'16/9', cursor:'pointer',
  };

  return (
    <div style={{maxWidth:960, margin:'0 auto', background:'#0a0a0a', minHeight:'100vh'}}>
      <style>{playerCSS}</style>
      <button style={s.backBtn} onClick={()=>setPage("home")}>← Буцах</button>

      <div style={{padding:`0 ${px}px 12px`}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:2,color:'#FF3B3B',textTransform:'uppercase',marginBottom:8}}>
          {movie.genre || 'Кино'}
        </div>
        <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,letterSpacing:1,margin:'0 0 8px',color:'#fff'}}>{movie.title}</h2>
        <p style={{fontSize:14,color:'#888',lineHeight:1.6,margin:0}}>{movie.description}</p>
      </div>

      {/* Player shell */}
      <div ref={shellRef} style={psBase}
        onMouseMove={showOverlay}
        onMouseLeave={() => { if (playing) overlayRef.current?.classList.add('kt-hidden'); }}
        onClick={togglePlay}>

        <video ref={vidRef} src={movie.videoUrl} style={{width:'100%',height:'100%',display:'block',objectFit:'contain'}} />

        {/* Spinner */}
        <div ref={spinnerRef} className="kt-spinner" />

        {/* Overlay */}
        <div ref={overlayRef} className="kt-overlay" onClick={e => e.stopPropagation()}>

          {/* Big center play/pause */}
          <div className="kt-center-btn" onClick={togglePlay}>
            {playing
              ? <svg width="26" height="26" viewBox="0 0 26 26" fill="white"><rect x="4" y="3" width="5" height="20" rx="1"/><rect x="17" y="3" width="5" height="20" rx="1"/></svg>
              : <svg width="26" height="26" viewBox="0 0 26 26" fill="white"><polygon points="7,3 23,13 7,23"/></svg>
            }
          </div>

          {/* Bottom controls */}
          <div className="kt-controls">
            {/* Progress */}
            <div className="kt-prog" onClick={e => {
              const r = e.currentTarget.getBoundingClientRect();
              if (vidRef.current) vidRef.current.currentTime = ((e.clientX - r.left) / r.width) * (vidRef.current.duration || 0);
            }}>
              <div ref={buffRef} className="kt-prog-buf" style={{width:'0%'}} />
              <div ref={fillRef} className="kt-prog-fill" style={{width:'0%'}} />
            </div>

            {/* Button row */}
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              {/* Play */}
              <button className="kt-btn" onClick={togglePlay}>
                {playing
                  ? <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><rect x="3" y="2" width="4" height="14" rx="0.5"/><rect x="11" y="2" width="4" height="14" rx="0.5"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><polygon points="4,2 16,9 4,16"/></svg>
                }
              </button>
              {/* Skip back */}
              <button className="kt-btn" onClick={()=>skip(-10)}>
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6"/><path d="M8 2L5.5 4.5 8 7"/>
                  <text x="5" y="10.5" fontSize="4.5" fill="currentColor" stroke="none" fontFamily="sans-serif">10</text>
                </svg>
              </button>
              {/* Skip fwd */}
              <button className="kt-btn" onClick={()=>skip(10)}>
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M9 2c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6"/><path d="M9 2l2.5 2.5L9 7"/>
                  <text x="5" y="10.5" fontSize="4.5" fill="currentColor" stroke="none" fontFamily="sans-serif">10</text>
                </svg>
              </button>
              {/* Time */}
              <span ref={timeRef} style={{fontSize:13,color:'#aaa',fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap'}}>0:00 / 0:00</span>

              <div style={{flex:1}} />

              {/* Volume */}
              <button className="kt-btn" onClick={toggleMute}>
                {muted || vol==0
                  ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><polygon points="3,6 7,6 12,2 12,16 7,12 3,12"/><line x1="15" y1="6" x2="15" y2="12"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><polygon points="3,6 7,6 12,2 12,16 7,12 3,12"/><path d="M14 6c1 1 1 5 0 6"/><path d="M15.5 4c2 2 2 8 0 10"/></svg>
                }
              </button>
              <input type="range" min="0" max="1" step="0.01" value={muted?0:vol}
                onChange={e=>handleVolChange(parseFloat(e.target.value))}
                style={{width:70,height:3,accentColor:'#FF3B3B',cursor:'pointer'}} />

              {/* Speed */}
              <button className="kt-speed" onClick={cycleSpeed}>{speed}×</button>

              {/* Fullscreen */}
              <button className="kt-btn" onClick={toggleFS}>
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M2 5V2h3M12 2h3v3M15 12v3h-3M5 15H2v-3"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


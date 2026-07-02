import { useEffect, useRef, useState } from 'react';

interface Props {
  onCapture: (base64: string, previewSrc: string) => void;
  onClose: () => void;
}

type TimerMode = 0 | 3 | 10;

const ZOOM_STEPS = [
  { scale: 1.0, mm: 30 },
  { scale: 1.5, mm: 45 },
  { scale: 2.0, mm: 60 },
];

const TEMP_STEPS = [
  { label: '❄',  filter: 'hue-rotate(-22deg) saturate(0.82)',            bg: 'rgba(170,205,255,0.88)' },
  { label: 'A',  filter: '',                                              bg: 'rgba(230,215,195,0.9)'  },
  { label: '🔥', filter: 'sepia(0.22) saturate(1.18) hue-rotate(8deg)',  bg: 'rgba(255,195,120,0.88)' },
];

const FILM_STEPS = [
  { label: '●',    filter: '' },
  { label: 'FADE', filter: 'contrast(0.88) brightness(1.08) saturate(0.78)' },
  { label: 'CR',   filter: 'contrast(1.22) saturate(1.35) brightness(0.95)' },
  { label: 'MATTE',filter: 'contrast(0.82) brightness(1.1) saturate(0.7) sepia(0.1)' },
];

const EXPOSURE_STEPS = [
  { label: '-1',  filter: 'brightness(0.55)' },
  { label: '-½',  filter: 'brightness(0.78)' },
  { label: '0',   filter: '' },
  { label: '+½',  filter: 'brightness(1.25)' },
  { label: '+1',  filter: 'brightness(1.55)' },
];

export function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [timerMode, setTimerMode] = useState<TimerMode>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [zoomIdx, setZoomIdx] = useState(0);
  const [tempIdx, setTempIdx] = useState(1);     // default: 'A' (neutral)
  const [filmIdx, setFilmIdx] = useState(0);     // default: normal
  const [expIdx, setExpIdx] = useState(2);       // default: 0

  const zoom     = ZOOM_STEPS[zoomIdx]!;
  const temp     = TEMP_STEPS[tempIdx]!;
  const film     = FILM_STEPS[filmIdx]!;
  const exposure = EXPOSURE_STEPS[expIdx]!;

  // Combined CSS filter for video preview and canvas capture
  const combinedFilter = [film.filter, temp.filter, exposure.filter]
    .filter(Boolean).join(' ') || 'none';

  useEffect(() => {
    startCamera(facingMode);
    return () => stopCamera();
  }, [facingMode]);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  async function startCamera(mode: 'user' | 'environment') {
    stopCamera();
    setReady(false);
    setError(null);
    setTorchOn(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const caps = track?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
      setHasTorch(!!caps?.torch);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch {
      setError('Camera not available. Please allow access or use file upload.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch { /* not supported */ }
  }

  function cycleTimer()    { setTimerMode((m) => m === 0 ? 3 : m === 3 ? 10 : 0); }
  function cycleZoom()     { setZoomIdx((i) => (i + 1) % ZOOM_STEPS.length); }
  function cycleTemp()     { setTempIdx((i) => (i + 1) % TEMP_STEPS.length); }
  function cycleFilm()     { setFilmIdx((i) => (i + 1) % FILM_STEPS.length); }
  function cycleExposure() { setExpIdx((i) => (i + 1) % EXPOSURE_STEPS.length); }

  function doCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const scale = zoom.scale;
    const sw = video.videoWidth / scale;
    const sh = video.videoHeight / scale;
    const sx = (video.videoWidth - sw) / 2;
    const sy = (video.videoHeight - sh) / 2;

    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext('2d')!;

    // Apply same colour filters to captured image
    ctx.filter = combinedFilter;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const f = flashRef.current;
    if (f) { f.style.opacity = '1'; setTimeout(() => { if (f) f.style.opacity = '0'; }, 130); }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopCamera();
    onCapture(dataUrl.split(',')[1]!, dataUrl);
  }

  function handleShutter() {
    if (!ready || countdown !== null) return;
    if (timerMode === 0) { doCapture(); return; }
    let count = timerMode;
    setCountdown(count);
    countdownRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
        setCountdown(null);
        doCapture();
      } else {
        setCountdown(count);
      }
    }, 1000);
  }

  function cancelCountdown() {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setCountdown(null);
  }

  const flip = () => setFacingMode((m) => m === 'user' ? 'environment' : 'user');
  const hasFilters = combinedFilter !== 'none';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      userSelect: 'none',
    }}>
      {/* Flash overlay */}
      <div ref={flashRef} style={{
        position: 'absolute', inset: 0, zIndex: 20,
        background: '#fff', opacity: 0, pointerEvents: 'none',
        transition: 'opacity 0.13s ease',
      }} />

      <div style={{ height: 44, flexShrink: 0 }} />

      {/* Viewfinder */}
      <div style={{ position: 'relative', width: '88%', maxWidth: 420, flexShrink: 0 }}>
        <div style={{
          position: 'relative', aspectRatio: '3/4',
          borderRadius: 22,
          border: `2.5px solid ${hasFilters ? 'rgba(255,200,100,0.7)' : 'rgba(255,255,255,0.88)'}`,
          overflow: 'hidden', background: '#111',
          transition: 'border-color 0.3s',
        }}>
          {error ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ef4444', padding: 24, textAlign: 'center', fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📷</div>
              {error}
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay playsInline muted
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transform: `${facingMode === 'user' ? 'scaleX(-1) ' : ''}scale(${zoom.scale})`,
                filter: combinedFilter,
                transition: 'transform 0.2s ease, filter 0.25s ease',
              }}
            />
          )}

          {/* Top: mm label + close */}
          {!error && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 28 }} />
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'system-ui', letterSpacing: 0.3, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                {zoom.mm}mm
              </span>
              <button
                onClick={() => { cancelCountdown(); stopCamera(); onClose(); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', fontSize: 18, cursor: 'pointer', padding: 0, lineHeight: 1, letterSpacing: 2 }}
              >
                •••
              </button>
            </div>
          )}

          {/* Countdown */}
          {countdown !== null && (
            <div onClick={cancelCountdown} style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', cursor: 'pointer' }}>
              <span style={{ fontSize: 100, fontWeight: 800, color: '#fff', lineHeight: 1, fontFamily: 'system-ui', textShadow: '0 0 40px rgba(255,255,255,0.5)' }}>{countdown}</span>
            </div>
          )}

          {/* Bottom controls strip */}
          {!error && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '20px 14px 14px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {/* Film mode — cycles through Normal/Fade/Chrome/Matte */}
              <button
                onClick={cycleFilm}
                style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: filmIdx === 0 ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.2)',
                  border: `1px solid ${filmIdx === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title={`Film: ${film.label}`}
              >
                <FilmIcon active={filmIdx !== 0} />
              </button>

              {/* Temperature — cycles cold/neutral/warm */}
              <button
                onClick={cycleTemp}
                style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: temp.bg,
                  border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: tempIdx !== 1 ? 16 : 0,
                  transition: 'background 0.25s',
                }}
                title={`Temperature: ${temp.label}`}
              >
                {tempIdx !== 1
                  ? <span style={{ lineHeight: 1 }}>{temp.label}</span>
                  : <TempIcon />
                }
              </button>

              <div style={{ flex: 1 }} />

              {/* Zoom */}
              <button
                onClick={cycleZoom}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: '#fff', fontSize: 22, fontWeight: 700, fontFamily: 'system-ui', textShadow: '0 1px 4px rgba(0,0,0,0.5)', lineHeight: 1 }}
              >
                {zoom.mm}
              </button>

              <div style={{ flex: 1 }} />

              {/* Exposure: icon + tappable value */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ExposureIcon />
                <button
                  onClick={cycleExposure}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: expIdx !== 2 ? '#ffd060' : '#fff',
                    fontSize: 14, fontWeight: 700, fontFamily: 'system-ui',
                    minWidth: 24, textAlign: 'center',
                    transition: 'color 0.2s',
                  }}
                  title="Tap to change exposure"
                >
                  {exposure.label}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 20, flexShrink: 0 }} />

      {/* 5 icon buttons */}
      {!error && (
        <div style={{ width: '88%', maxWidth: 420, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <IconBtn disabled>
            <GalleryAddIcon />
          </IconBtn>
          <IconBtn disabled>
            <FramesIcon />
          </IconBtn>
          <IconBtn onClick={cycleTimer} active={timerMode !== 0}>
            <TimerIcon active={timerMode !== 0} label={timerMode !== 0 ? `${timerMode}` : undefined} />
          </IconBtn>
          <IconBtn onClick={hasTorch ? toggleTorch : undefined} active={torchOn} disabled={!hasTorch}>
            <FlashIcon active={torchOn} />
          </IconBtn>
          <IconBtn onClick={flip}>
            <RotateIcon />
          </IconBtn>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Bottom row */}
      {!error && (
        <div style={{ width: '88%', maxWidth: 420, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 36, flexShrink: 0 }}>
          <button
            onClick={() => { cancelCountdown(); stopCamera(); onClose(); }}
            style={{ width: 56, height: 56, borderRadius: 14, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.65)', fontSize: 18 }}
          >
            ✕
          </button>

          <button
            onClick={handleShutter}
            disabled={!ready || countdown !== null}
            style={{
              width: 76, height: 76, borderRadius: '50%',
              background: ready && countdown === null ? '#fff' : 'rgba(255,255,255,0.35)',
              border: '3px solid rgba(255,255,255,0.25)',
              outline: '3px solid rgba(255,255,255,0.55)',
              outlineOffset: 3,
              cursor: ready && countdown === null ? 'pointer' : 'default',
              transition: 'all .15s', flexShrink: 0,
            }}
          />

          <button
            onClick={flip}
            style={{ width: 56, height: 56, borderRadius: 14, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <CameraBodyIcon />
          </button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────────────────────── */

function IconBtn({ children, onClick, active, disabled }: { children: React.ReactNode; onClick?: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: 42, height: 42, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.28 : active ? 1 : 0.75, padding: 0 }}>
      {children}
    </button>
  );
}

function FilmIcon({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'rgba(255,255,255,0.8)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18"/>
      <line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/>
      <line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>
    </svg>
  );
}

function TempIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(60,40,20,0.8)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  );
}

function ExposureIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function GalleryAddIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
      <line x1="19" y1="3" x2="19" y2="7"/><line x1="17" y1="5" x2="21" y2="5"/>
    </svg>
  );
}

function FramesIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <rect x="7" y="7" width="10" height="10" rx="1"/>
    </svg>
  );
}

function TimerIcon({ active, label }: { active: boolean; label?: string }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'rgba(255,255,255,0.75)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="13" r="8"/>
        <polyline points="12 9 12 13 14.5 13"/>
        <line x1="8" y1="3" x2="16" y2="3"/>
      </svg>
      {label && (
        <span style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 9, fontWeight: 700, background: 'rgba(255,107,157,0.85)', borderRadius: 4, padding: '1px 3px', lineHeight: 1.2 }}>{label}s</span>
      )}
    </div>
  );
}

function FlashIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="26" viewBox="0 0 24 24" fill={active ? '#fff' : 'none'} stroke={active ? '#fff' : 'rgba(255,255,255,0.75)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <polyline points="23 20 23 14 17 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  );
}

function CameraBodyIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

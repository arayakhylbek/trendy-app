import { useEffect, useRef, useState } from 'react';

interface Props {
  onCapture: (base64: string, previewSrc: string) => void;
  onClose: () => void;
}

type TimerMode = 0 | 3 | 10;

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
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
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
    } catch {
      // torch not supported on this device
    }
  }

  function cycleTimer() {
    setTimerMode((m) => (m === 0 ? 3 : m === 3 ? 10 : 0));
  }

  function doCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    // Flash overlay
    const f = flashRef.current;
    if (f) {
      f.style.opacity = '1';
      setTimeout(() => { if (f) f.style.opacity = '0'; }, 130);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const base64 = dataUrl.split(',')[1]!;
    stopCamera();
    onCapture(base64, dataUrl);
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

  const timerLabel = timerMode === 0 ? 'Timer' : `${timerMode}s`;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* Flash overlay */}
      <div
        ref={flashRef}
        style={{ position: 'absolute', inset: 0, zIndex: 10, background: '#fff', opacity: 0, pointerEvents: 'none', transition: 'opacity 0.13s ease' }}
      />

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', flexShrink: 0, zIndex: 5 }}>
        <button
          onClick={() => { cancelCountdown(); stopCamera(); onClose(); }}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', padding: '7px 14px', borderRadius: 20, fontFamily: '"DM Sans", sans-serif', fontWeight: 500 }}
        >
          ✕ Cancel
        </button>
        <span style={{ color: '#888', fontSize: 13, fontFamily: '"DM Sans", sans-serif' }}>Take a photo</span>
        {/* spacer to keep title centered */}
        <div style={{ width: 84 }} />
      </div>

      {/* Video feed */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {error ? (
          <div style={{ color: '#ef4444', textAlign: 'center', padding: 32, fontSize: 14, lineHeight: 1.6 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
            {error}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
        )}

        {/* Vignette */}
        {!error && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 80% at 50% 40%, transparent 60%, rgba(0,0,0,0.4) 100%)' }} />
        )}

        {/* Countdown overlay */}
        {countdown !== null && (
          <div
            onClick={cancelCountdown}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 96, fontWeight: 800, color: '#fff', fontFamily: '"DM Sans", sans-serif', textShadow: '0 0 40px rgba(255,255,255,0.6)', lineHeight: 1 }}>
              {countdown}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 12, fontFamily: '"DM Sans", sans-serif' }}>
              Tap to cancel
            </span>
          </div>
        )}
      </div>

      {/* Bottom: controls + shutter */}
      {!error && (
        <div style={{ flexShrink: 0, paddingBottom: 48, zIndex: 5 }}>
          {/* Control buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, padding: '0 24px 22px' }}>
            <CamControl
              icon="🔄"
              label="Rotate"
              active={false}
              onClick={() => setFacingMode((m) => m === 'user' ? 'environment' : 'user')}
            />
            <CamControl
              icon={torchOn ? '⚡' : '🔦'}
              label={torchOn ? 'On' : 'Flash'}
              active={torchOn}
              onClick={hasTorch ? toggleTorch : undefined}
              disabled={!hasTorch}
              title={hasTorch ? undefined : 'Flash not available'}
            />
            <CamControl
              icon="⏱"
              label={timerLabel}
              active={timerMode !== 0}
              onClick={cycleTimer}
            />
          </div>

          {/* Shutter */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={handleShutter}
              disabled={!ready || countdown !== null}
              style={{
                width: 72, height: 72, borderRadius: '50%',
                background: ready && countdown === null ? '#fff' : '#555',
                border: '4px solid rgba(255,255,255,0.3)',
                cursor: ready && countdown === null ? 'pointer' : 'default',
                boxShadow: ready && countdown === null ? '0 0 0 6px rgba(255,255,255,0.15)' : 'none',
                transition: 'all .2s',
              }}
            />
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

function CamControl({
  icon, label, active, onClick, disabled, title,
}: {
  icon: string; label: string; active: boolean;
  onClick?: () => void; disabled?: boolean; title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        background: active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 16, padding: '10px 18px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        transition: 'background .15s, border-color .15s',
        minWidth: 68,
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
      <span style={{ color: active ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>
        {label}
      </span>
    </button>
  );
}

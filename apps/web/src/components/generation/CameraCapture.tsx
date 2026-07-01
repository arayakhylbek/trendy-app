import { useEffect, useRef, useState } from 'react';

interface Props {
  onCapture: (base64: string, previewSrc: string) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    startCamera(facingMode);
    return () => stopCamera();
  }, [facingMode]);

  async function startCamera(mode: 'user' | 'environment') {
    stopCamera();
    setReady(false);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
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

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;

    // Mirror horizontally for front camera (selfie)
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const base64 = dataUrl.split(',')[1]!;
    stopCamera();
    onCapture(base64, dataUrl);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: '#000',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', flexShrink: 0,
      }}>
        <button
          onClick={() => { stopCamera(); onClose(); }}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', padding: '6px 12px', borderRadius: 20 } as React.CSSProperties}
        >
          ✕ Cancel
        </button>
        <span style={{ color: '#888', fontSize: 13 }}>Take a selfie</span>
        {/* Flip camera button */}
        <button
          onClick={() => setFacingMode((m) => m === 'user' ? 'environment' : 'user')}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', padding: '6px 12px', borderRadius: 20 } as React.CSSProperties}
          title="Flip camera"
        >
          🔄
        </button>
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
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
            }}
          />
        )}

        {/* Viewfinder overlay */}
        {!error && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 60% 80% at 50% 40%, transparent 60%, rgba(0,0,0,0.4) 100%)',
          }} />
        )}
      </div>

      {/* Shutter button */}
      {!error && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0 48px', flexShrink: 0 }}>
          <button
            onClick={capture}
            disabled={!ready}
            style={{
              width: 72, height: 72, borderRadius: '50%',
              background: ready ? '#fff' : '#555',
              border: '4px solid rgba(255,255,255,0.3)',
              cursor: ready ? 'pointer' : 'default',
              boxShadow: ready ? '0 0 0 6px rgba(255,255,255,0.15)' : 'none',
              transition: 'all .2s',
            }}
          />
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

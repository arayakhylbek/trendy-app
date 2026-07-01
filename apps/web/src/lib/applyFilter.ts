// Canvas-based photo filters

function sCurve(v: number): number {
  // Gentle S-curve for contrast
  return v + 0.07 * v * (1 - v) * (2 * v - 1);
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, v));
}

// ── GRD R ──────────────────────────────────────────────────────────────────
// Mimics Dazz Cam GRD R / Canon G7X compact digital look:
// lifted blacks, warm orange cast, slight fade, film grain, soft vignette
function applyGrdR(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i]! / 255;
    let g = d[i + 1]! / 255;
    let b = d[i + 2]! / 255;

    // 1. Lift shadows (matte / faded film look)
    r = r * 0.84 + 0.08;
    g = g * 0.84 + 0.065;
    b = b * 0.84 + 0.055;

    // 2. Warm orange cast — peaks in midtones
    const luma = r * 0.299 + g * 0.587 + b * 0.114;
    const warmth = Math.sin(luma * Math.PI) * 0.055;
    r = Math.min(1, r + warmth * 1.4);
    g = Math.min(1, g + warmth * 0.35);
    b = Math.max(0, b - warmth * 0.25);

    // 3. Slight S-curve contrast
    r = sCurve(r);
    g = sCurve(g);
    b = sCurve(b);

    // 4. Very slight desaturation (compact cam look)
    const gray = r * 0.299 + g * 0.587 + b * 0.114;
    r = r * 0.88 + gray * 0.12;
    g = g * 0.88 + gray * 0.12;
    b = b * 0.88 + gray * 0.12;

    // 5. Film grain
    const grain = (Math.random() - 0.5) * 0.055;
    r = Math.min(1, Math.max(0, r + grain));
    g = Math.min(1, Math.max(0, g + grain));
    b = Math.min(1, Math.max(0, b + grain));

    d[i] = clamp(Math.round(r * 255));
    d[i + 1] = clamp(Math.round(g * 255));
    d[i + 2] = clamp(Math.round(b * 255));
  }

  ctx.putImageData(imageData, 0, 0);

  // 6. Soft vignette
  const vg = ctx.createRadialGradient(
    width / 2, height * 0.45, height * 0.12,
    width / 2, height * 0.5, Math.max(width, height) * 0.78,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10,5,0,0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, width, height);
}

// ── Registry ───────────────────────────────────────────────────────────────
const FILTERS: Record<string, (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void> = {
  grdr: applyGrdR,
};

export async function applyFilter(dataUrl: string, filterId: string): Promise<string> {
  const fn = FILTERS[filterId];
  if (!fn) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      fn(canvas, ctx);
      resolve(canvas.toDataURL('image/jpeg', 0.93));
    };
    img.src = dataUrl;
  });
}

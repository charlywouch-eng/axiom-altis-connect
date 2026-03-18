import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  decay: number;
  shape: "rect" | "circle";
}

const COLORS = [
  "hsl(221,83%,53%)",  // primary blue
  "hsl(187,94%,43%)",  // accent cyan
  "hsl(142,76%,36%)",  // success green
  "hsl(45,93%,58%)",   // gold
  "hsl(330,80%,60%)",  // pink
  "hsl(271,76%,53%)",  // purple
];

export function ConfettiCanvas({ trigger }: { trigger: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger) return;

    // ── Celebration chime (Web Audio API) ──
    try {
      const audioCtx = new AudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + i * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.12 + 0.35);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.12);
        osc.stop(audioCtx.currentTime + i * 0.12 + 0.4);
      });
    } catch {
      // Silent fail if AudioContext unavailable
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const particles: Particle[] = [];
    const count = 80;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: rect.width / 2 + (Math.random() - 0.5) * 60,
        y: rect.height * 0.35,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 14 - 4,
        size: Math.random() * 6 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        opacity: 1,
        decay: 0.012 + Math.random() * 0.008,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      });
    }

    let animId: number;
    const gravity = 0.35;

    function animate() {
      ctx!.clearRect(0, 0, rect.width, rect.height);
      let alive = false;

      for (const p of particles) {
        if (p.opacity <= 0) continue;
        alive = true;

        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.decay;

        ctx!.save();
        ctx!.globalAlpha = Math.max(0, p.opacity);
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.restore();
      }

      if (alive) {
        animId = requestAnimationFrame(animate);
      }
    }

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

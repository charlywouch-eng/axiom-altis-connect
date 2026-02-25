import { useEffect, useRef, useCallback } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  pulsePhase: number;
}

interface NetworkCanvasProps {
  className?: string;
  nodeCount?: number;
  /** Primary accent color in HSL, e.g. "187, 94%, 43%" */
  color?: string;
  /** Secondary glow color */
  color2?: string;
  maxDistance?: number;
}

export default function NetworkCanvas({
  className = "",
  nodeCount = 38,
  color = "187, 94%, 43%",
  color2 = "221, 83%, 53%",
  maxDistance = 160,
}: NetworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const initNodes = useCallback(
    (w: number, h: number) => {
      const nodes: Node[] = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: 1.8 + Math.random() * 2.2,
          opacity: 0.25 + Math.random() * 0.45,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
      return nodes;
    },
    [nodeCount],
  );

  // Respect prefers-reduced-motion
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (prefersReducedMotion) return; // Skip animation entirely
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (nodesRef.current.length === 0) {
        nodesRef.current = initNodes(w, h);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => {
      mouseRef.current = null;
    };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    let t = 0;
    const draw = () => {
      t += 0.012;
      ctx.clearRect(0, 0, w, h);
      const nodes = nodesRef.current;
      const mouse = mouseRef.current;

      // Update positions
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        // Subtle mouse attraction
        if (mouse) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            n.vx += (dx / dist) * 0.008;
            n.vy += (dy / dist) * 0.008;
          }
        }

        // Dampen
        n.vx *= 0.998;
        n.vy *= 0.998;
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.18;
            const usePrimary = (i + j) % 3 === 0;
            ctx.strokeStyle = `hsla(${usePrimary ? color2 : color}, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes (spherical glow)
      for (const n of nodes) {
        const pulse = Math.sin(t * 1.5 + n.pulsePhase) * 0.15 + 0.85;
        const r = n.radius * pulse;
        const alpha = n.opacity * pulse;

        // Outer glow
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 4);
        glow.addColorStop(0, `hsla(${color}, ${alpha * 0.5})`);
        glow.addColorStop(1, `hsla(${color}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core sphere
        const grad = ctx.createRadialGradient(n.x - r * 0.3, n.y - r * 0.3, 0, n.x, n.y, r);
        grad.addColorStop(0, `hsla(${color}, ${alpha})`);
        grad.addColorStop(0.7, `hsla(${color2}, ${alpha * 0.7})`);
        grad.addColorStop(1, `hsla(${color}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [initNodes, color, color2, maxDistance]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-auto ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

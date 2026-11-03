import { useEffect, useRef } from 'react';

export default function Confetti({ theme = 'cyber' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    let colors = ['#00ffcc', '#ffd700', '#9d4edd', '#00e5ff', '#ffffff'];
    if (theme === 'synthwave') {
      colors = ['#ff007f', '#ffe600', '#ff00aa', '#ffaa00', '#9d02d7'];
    } else if (theme === 'matrix') {
      colors = ['#00ff66', '#b3ffcc', '#33ff88', '#00cc55', '#ffffff'];
    }

    const count = 140;
    const particles = Array.from({ length: count }, () => ({
      x: width / 2 + (Math.random() - 0.5) * 250,
      y: height / 2 - 60,
      vx: (Math.random() - 0.5) * 18,
      vy: -(Math.random() * 14 + 7),
      size: Math.random() * 9 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 14,
      gravity: 0.3,
      drag: 0.985,
      alpha: 1,
    }));

    const update = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.vx *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        if (p.y > height * 0.65) {
          p.alpha -= 0.009;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        ctx.restore();
      });

      animationId = requestAnimationFrame(update);
    };

    update();

    return () => cancelAnimationFrame(animationId);
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    />
  );
}

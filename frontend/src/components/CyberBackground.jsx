import { useEffect, useRef } from 'react';

export default function CyberBackground({ theme = 'cyber' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // ── 1. Cyber Particles ────────────────────────────────────────────────
    const particleCount = Math.min(48, Math.floor((width * height) / 24000));
    const cyberParticles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 2.2 + 1,
      color: Math.random() > 0.35 ? 'rgba(0, 255, 204, ' : 'rgba(157, 78, 221, ',
      alpha: Math.random() * 0.45 + 0.15,
    }));

    // ── 2. Matrix Digital Rain ────────────────────────────────────────────
    const matrixFontSize = 16;
    const matrixColumns = Math.floor(width / matrixFontSize);
    const matrixDrops = Array.from({ length: matrixColumns }, () => Math.floor(Math.random() * -50));
    const matrixChars = '0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ'.split('');

    // ── 3. Sweet Hearts & Teddy Particles ─────────────────────────────────
    const heartColors = ['#ff6b8b', '#ff85a2', '#f72585', '#ff9ebb', '#ffd1dc', '#fff0f5'];
    const heartCount = Math.min(36, Math.floor((width * height) / 26000));
    const hearts = Array.from({ length: heartCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 16 + 10,
      vy: Math.random() * 0.7 + 0.35,
      swaySpeed: Math.random() * 0.025 + 0.015,
      swayOffset: Math.random() * Math.PI * 2,
      swayAmp: Math.random() * 1.6 + 0.8,
      color: heartColors[Math.floor(Math.random() * heartColors.length)],
      alpha: Math.random() * 0.45 + 0.25,
      rotation: (Math.random() - 0.5) * 0.4,
      isTeddy: Math.random() < 0.22, // cute floating teddy head
    }));

    // Ambient floating twinkles for hearts theme
    const sparkles = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 1,
      alpha: Math.random() * 0.8 + 0.2,
      vAlpha: (Math.random() - 0.5) * 0.02,
    }));

    // ── 4. Sakura Kawaii (Cherry Blossom Petals & Starlight) ───────────────
    const sakuraColors = ['#ffb7c5', '#ffccd5', '#ff9ebb', '#fbcfe8', '#f472b6', '#fdf2f8'];
    const petalCount = Math.min(42, Math.floor((width * height) / 22000));
    const petals = Array.from({ length: petalCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 14 + 8,
      vy: Math.random() * 1.1 + 0.6,
      vx: Math.random() * 0.9 + 0.4, // gentle rightward breeze
      angle: Math.random() * Math.PI * 2,
      vAngle: (Math.random() - 0.5) * 0.03,
      flip: Math.random() * Math.PI,
      vFlip: Math.random() * 0.03 + 0.015,
      color: sakuraColors[Math.floor(Math.random() * sakuraColors.length)],
      alpha: Math.random() * 0.55 + 0.3,
    }));

    let time = 0;

    // Helper: Draw smooth bezier heart
    const drawHeart = (x, y, size, color, alpha, rot) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      const top = -size * 0.4;
      ctx.moveTo(0, top + size * 0.3);
      ctx.bezierCurveTo(0, top, -size / 2, top, -size / 2, top + size * 0.35);
      ctx.bezierCurveTo(-size / 2, top + size * 0.7, 0, top + size * 0.95, 0, top + size);
      ctx.bezierCurveTo(0, top + size * 0.95, size / 2, top + size * 0.7, size / 2, top + size * 0.35);
      ctx.bezierCurveTo(size / 2, top, 0, top, 0, top + size * 0.3);
      ctx.closePath();
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff85a2';
      ctx.fill();
      ctx.restore();
    };

    // Helper: Draw cute teddy silhouette
    const drawTeddy = (x, y, size, color, alpha) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha * 0.85;

      // Ears
      const earRadius = size * 0.32;
      ctx.beginPath();
      ctx.arc(-size * 0.6, -size * 0.5, earRadius, 0, Math.PI * 2);
      ctx.arc(size * 0.6, -size * 0.5, earRadius, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.75, 0, Math.PI * 2);
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#f472b6';
      ctx.fill();

      // Snout patch
      ctx.fillStyle = '#fff0f5';
      ctx.beginPath();
      ctx.arc(0, size * 0.15, size * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // Nose & Eyes
      ctx.fillStyle = '#4a2835';
      ctx.beginPath();
      ctx.arc(0, size * 0.08, size * 0.1, 0, Math.PI * 2); // nose
      ctx.arc(-size * 0.28, -size * 0.12, size * 0.07, 0, Math.PI * 2); // left eye
      ctx.arc(size * 0.28, -size * 0.12, size * 0.07, 0, Math.PI * 2); // right eye
      ctx.fill();

      ctx.restore();
    };

    // Helper: Draw 3D fluttering sakura petal
    const drawPetal = (p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.scale(1, Math.cos(p.flip)); // Realistic 3D flutter
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#ffb7c5';
      ctx.beginPath();
      const s = p.size;
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.6, -s * 0.7, s * 0.8, s * 0.25, 0, s);
      ctx.bezierCurveTo(-s * 0.8, s * 0.25, -s * 0.6, -s * 0.7, 0, -s);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // ── Main Render Loop ──────────────────────────────────────────────────
    const render = () => {
      time += 0.02;

      // ═════ THEME 1: CYBER (Laser Mesh + Mouse Gravity) ═════
      if (theme === 'cyber') {
        ctx.clearRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(0, 255, 204, 0.035)';
        ctx.lineWidth = 1;
        const gridSize = 46;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        for (let i = 0; i < cyberParticles.length; i++) {
          const p = cyberParticles[i];
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            p.x += dx * 0.018;
            p.y += dy * 0.018;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color + p.alpha + ')';
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#00ffcc';
          ctx.fill();
          ctx.shadowBlur = 0;

          for (let j = i + 1; j < cyberParticles.length; j++) {
            const p2 = cyberParticles[j];
            const cdx = p.x - p2.x;
            const cdy = p.y - p2.y;
            const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
            if (cdist < 120) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(0, 255, 204, ${0.14 * (1 - cdist / 120)})`;
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      // ═════ THEME 2: SWEET HEARTS & TEDDY (Pastel Rose & Floating Hearts) ═════
      else if (theme === 'sweethearts') {
        // Dreamy soft twilight cotton gradient background
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#1c0a1a');
        bgGrad.addColorStop(0.5, '#2e1028');
        bgGrad.addColorStop(1, '#180718');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Soft ambient pink glow orbs
        const glowGrad = ctx.createRadialGradient(width * 0.5, height * 0.45, 40, width * 0.5, height * 0.45, width * 0.5);
        glowGrad.addColorStop(0, 'rgba(255, 107, 139, 0.12)');
        glowGrad.addColorStop(0.7, 'rgba(247, 37, 133, 0.04)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, width, height);

        // Sparkles
        sparkles.forEach(s => {
          s.alpha += s.vAlpha;
          if (s.alpha > 0.95 || s.alpha < 0.15) s.vAlpha *= -1;
          ctx.fillStyle = `rgba(255, 240, 245, ${s.alpha})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        });

        // Floating Hearts & Teddy Heads (Floating upward gently with sine wave drift)
        hearts.forEach(h => {
          h.y -= h.vy;
          h.x += Math.sin(time + h.swayOffset) * h.swayAmp;

          // Gentle mouse dodge
          const mdx = mouse.x - h.x;
          const mdy = mouse.y - h.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 120) {
            h.x -= (mdx / mdist) * 2;
            h.y -= (mdy / mdist) * 2;
          }

          if (h.y < -30) {
            h.y = height + 30;
            h.x = Math.random() * width;
          }

          if (h.isTeddy) {
            drawTeddy(h.x, h.y, h.size * 0.85, h.color, h.alpha);
          } else {
            drawHeart(h.x, h.y, h.size, h.color, h.alpha, h.rotation + Math.sin(time) * 0.08);
          }
        });
      }

      // ═════ THEME 3: SAKURA KAWAII (Fluttering Cherry Blossoms & Lilac Starlight) ═════
      else if (theme === 'sakura') {
        // Deep magical lilac anime night sky
        const sakuraSky = ctx.createLinearGradient(0, 0, 0, height);
        sakuraSky.addColorStop(0, '#120b1e');
        sakuraSky.addColorStop(0.5, '#1e1131');
        sakuraSky.addColorStop(1, '#2c1236');
        ctx.fillStyle = sakuraSky;
        ctx.fillRect(0, 0, width, height);

        // Gentle moon halo in top corner
        const moonGlow = ctx.createRadialGradient(width * 0.85, height * 0.15, 10, width * 0.85, height * 0.15, 220);
        moonGlow.addColorStop(0, 'rgba(253, 242, 248, 0.18)');
        moonGlow.addColorStop(0.5, 'rgba(244, 114, 182, 0.08)');
        moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = moonGlow;
        ctx.fillRect(0, 0, width, height);

        // Falling 3D flutter petals
        petals.forEach(p => {
          p.x += p.vx + Math.sin(time + p.flip) * 0.8;
          p.y += p.vy;
          p.angle += p.vAngle;
          p.flip += p.vFlip;

          // Wrap around
          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * width - 40;
          }
          if (p.x > width + 20) {
            p.x = -20;
          }

          drawPetal(p);
        });
      }

      // ═════ THEME 4: MATRIX (Digital Rain Phosphor Cascade) ═════
      else if (theme === 'matrix') {
        ctx.fillStyle = 'rgba(2, 9, 4, 0.12)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = `${matrixFontSize}px monospace`;

        for (let i = 0; i < matrixDrops.length; i++) {
          const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          const x = i * matrixFontSize;
          const y = matrixDrops[i] * matrixFontSize;

          ctx.fillStyle = '#b3ffcc';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#00ff66';
          ctx.fillText(char, x, y);
          ctx.shadowBlur = 0;

          if (y > height && Math.random() > 0.975) {
            matrixDrops[i] = 0;
          }
          matrixDrops[i]++;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
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
        zIndex: 0,
      }}
    />
  );
}

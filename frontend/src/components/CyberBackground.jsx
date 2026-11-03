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

    // ── 1. Cyber Theme State ──────────────────────────────────────────────
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

    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // ── 2. Synthwave Theme State ──────────────────────────────────────────
    let gridOffset = 0;
    const stars = Array.from({ length: 70 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.65),
      size: Math.random() * 1.8 + 0.5,
      alpha: Math.random() * 0.8 + 0.2,
      vAlpha: (Math.random() - 0.5) * 0.02,
    }));

    // ── 3. Matrix Digital Rain State ──────────────────────────────────────
    const matrixFontSize = 16;
    const matrixColumns = Math.floor(width / matrixFontSize);
    const matrixDrops = Array.from({ length: matrixColumns }, () => Math.floor(Math.random() * -50));
    const matrixChars = '0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ'.split('');

    // ── Main Render Loop ──────────────────────────────────────────────────
    const render = () => {
      // ═════ THEME 1: CYBER (Laser Mesh + Mouse Gravity) ═════
      if (theme === 'cyber') {
        ctx.clearRect(0, 0, width, height);

        // Tech grid lines
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

          // Mouse attraction
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

          // Filament connecting lines
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

      // ═════ THEME 2: SYNTHWAVE (Retro Wireframe Horizon + Sun) ═════
      else if (theme === 'synthwave') {
        ctx.fillStyle = '#0a0414';
        ctx.fillRect(0, 0, width, height);

        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.65);
        skyGrad.addColorStop(0, '#0a0414');
        skyGrad.addColorStop(0.7, '#24083a');
        skyGrad.addColorStop(1, '#61115e');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height * 0.65);

        // Twinkling stars
        stars.forEach(s => {
          s.alpha += s.vAlpha;
          if (s.alpha > 0.9 || s.alpha < 0.2) s.vAlpha *= -1;
          ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
          ctx.fillRect(s.x, s.y, s.size, s.size);
        });

        // Glowing Retro Sun on Horizon
        const horizonY = height * 0.62;
        const sunRadius = Math.min(140, width * 0.16);
        const sunCenterX = width / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(sunCenterX, horizonY, sunRadius, Math.PI, 0, false);
        const sunGrad = ctx.createLinearGradient(0, horizonY - sunRadius, 0, horizonY);
        sunGrad.addColorStop(0, '#ffe600');
        sunGrad.addColorStop(0.5, '#ff007f');
        sunGrad.addColorStop(1, '#9d02d7');
        ctx.fillStyle = sunGrad;
        ctx.shadowBlur = 45;
        ctx.shadowColor = '#ff007f';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Sun horizontal black cutout bars (classic 80s synthwave)
        for (let b = 1; b <= 7; b++) {
          const barY = horizonY - sunRadius * (b / 8);
          const barHeight = b * 2;
          ctx.fillStyle = '#0a0414';
          ctx.fillRect(sunCenterX - sunRadius, barY, sunRadius * 2, barHeight);
        }
        ctx.restore();

        // 3D Perspective Ground Grid
        const gridCanvasHeight = height - horizonY;
        gridOffset = (gridOffset + 1.2) % 36;

        ctx.strokeStyle = 'rgba(255, 0, 127, 0.45)';
        ctx.lineWidth = 1.2;

        // Vertical radiating vanishing perspective lines
        const lineCount = 28;
        for (let i = 0; i <= lineCount; i++) {
          const bottomX = (width / lineCount) * i;
          ctx.beginPath();
          ctx.moveTo(sunCenterX, horizonY);
          ctx.lineTo(bottomX, height);
          ctx.stroke();
        }

        // Horizontal perspective lines scrolling towards camera
        for (let y = 0; y < gridCanvasHeight; y += 1) {
          const normalized = Math.pow(y / gridCanvasHeight, 2.5);
          const drawY = horizonY + normalized * gridCanvasHeight;
          if ((drawY + gridOffset) % 24 < 1.4) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 0, 127, ${0.15 + (normalized * 0.6)})`;
            ctx.moveTo(0, drawY);
            ctx.lineTo(width, drawY);
            ctx.stroke();
          }
        }
      }

      // ═════ THEME 3: MATRIX (Digital Rain Phosphor Cascade) ═════
      else if (theme === 'matrix') {
        // Fading phosphor background wash
        ctx.fillStyle = 'rgba(2, 9, 4, 0.12)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = `${matrixFontSize}px monospace`;

        for (let i = 0; i < matrixDrops.length; i++) {
          const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          const x = i * matrixFontSize;
          const y = matrixDrops[i] * matrixFontSize;

          // Bright white-green head glyph
          ctx.fillStyle = '#b3ffcc';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#00ff66';
          ctx.fillText(char, x, y);
          ctx.shadowBlur = 0;

          // Reset to top or advance drop
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

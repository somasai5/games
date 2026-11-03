import { useEffect, useState, useRef } from 'react';

export default function CustomCursor({ theme = 'cyber' }) {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [particles, setParticles] = useState([]);
  
  const mousePos = useRef({ x: -100, y: -100 });
  const followerPos = useRef({ x: -100, y: -100 });
  const followerEl = useRef(null);
  const lastSpawnTime = useRef(0);

  // Check if device has a fine pointer (mouse / trackpad)
  useEffect(() => {
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    setEnabled(isFinePointer);
  }, []);

  // Track mouse coordinates and handle click bursts
  useEffect(() => {
    if (!enabled) return;

    let animId;

    const onMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };

      // Spawn trail particles with throttle (every 45ms)
      const now = performance.now();
      if (now - lastSpawnTime.current > 45) {
        lastSpawnTime.current = now;

        let char = '•';
        if (theme === 'sweethearts') {
          const sweetIcons = ['💖', '✨', '💕', '🍓', '🧸'];
          char = sweetIcons[Math.floor(Math.random() * sweetIcons.length)];
        } else if (theme === 'sakura') {
          const sakuraIcons = ['🌸', '✨', '🍃', '💮'];
          char = sakuraIcons[Math.floor(Math.random() * sakuraIcons.length)];
        } else if (theme === 'matrix') {
          const matrixGlyphs = ['1', '0', '7', 'X', '9'];
          char = matrixGlyphs[Math.floor(Math.random() * matrixGlyphs.length)];
        }

        const newParticle = {
          id: Math.random(),
          x: e.clientX + (Math.random() - 0.5) * 12,
          y: e.clientY + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 1.5,
          vy: theme === 'sweethearts' || theme === 'sakura' ? -(Math.random() * 1.5 + 0.8) : (Math.random() - 0.5) * 1.5,
          char,
          opacity: 1,
          scale: Math.random() * 0.4 + 0.7,
        };

        setParticles(prev => [...prev.slice(-18), newParticle]);
      }
    };

    // Click burst: spawn 6 joyful micro particles!
    const onMouseDown = (e) => {
      const burst = [];
      for (let i = 0; i < 7; i++) {
        const angle = (Math.PI * 2 / 7) * i;
        const speed = Math.random() * 3 + 2;
        let char = '✦';
        if (theme === 'sweethearts') char = ['💖', '✨', '💕'][i % 3];
        else if (theme === 'sakura') char = ['🌸', '✨', '💮'][i % 3];
        else if (theme === 'matrix') char = ['0', '1'][i % 2];

        burst.push({
          id: Math.random(),
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          char,
          opacity: 1,
          scale: 1.1,
        });
      }
      setParticles(prev => [...prev.slice(-15), ...burst]);
    };

    // Detect hovering over clickable elements
    const onMouseOver = (e) => {
      const target = e.target;
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('.clickable-code') ||
        target.closest('.avatar-btn') ||
        target.closest('.cute-bubble') ||
        target.closest('.reaction-btn')
      ) {
        setHovering(true);
      } else {
        setHovering(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseover', onMouseOver);

    // Smooth physics follower loop (lerp)
    const updateFollower = () => {
      followerPos.current.x += (mousePos.current.x - followerPos.current.x) * 0.22;
      followerPos.current.y += (mousePos.current.y - followerPos.current.y) * 0.22;

      if (followerEl.current) {
        followerEl.current.style.transform = `translate3d(${followerPos.current.x}px, ${followerPos.current.y}px, 0)`;
      }

      // Update particle physics
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            opacity: p.opacity - 0.038,
            scale: Math.max(0, p.scale - 0.02),
          }))
          .filter(p => p.opacity > 0.05)
      );

      animId = requestAnimationFrame(updateFollower);
    };

    animId = requestAnimationFrame(updateFollower);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseover', onMouseOver);
      cancelAnimationFrame(animId);
    };
  }, [enabled, theme]);

  if (!enabled) return null;

  // Theme-specific glow colors
  let glowColor = 'rgba(0, 255, 204, 0.55)';
  let borderColor = '#00ffcc';
  if (theme === 'sweethearts') {
    glowColor = 'rgba(255, 107, 139, 0.65)';
    borderColor = '#ff6b8b';
  } else if (theme === 'sakura') {
    glowColor = 'rgba(244, 114, 182, 0.65)';
    borderColor = '#f472b6';
  } else if (theme === 'matrix') {
    glowColor = 'rgba(0, 255, 102, 0.6)';
    borderColor = '#00ff66';
  }

  return (
    <>
      {/* Smooth trailing glow follower ring */}
      <div
        ref={followerEl}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: hovering ? '42px' : '26px',
          height: hovering ? '42px' : '26px',
          marginTop: hovering ? '-21px' : '-13px',
          marginLeft: hovering ? '-21px' : '-13px',
          border: `1.5px solid ${borderColor}`,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 99999,
          boxShadow: `0 0 16px ${glowColor}, inset 0 0 8px ${glowColor}`,
          background: hovering ? glowColor : 'transparent',
          transition: 'width 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, margin 0.2s',
          willChange: 'transform',
        }}
      />

      {/* Trailing micro-particle magical dust */}
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            left: `${p.x}px`,
            top: `${p.y}px`,
            pointerEvents: 'none',
            zIndex: 99998,
            fontSize: theme === 'sweethearts' || theme === 'sakura' ? '0.95rem' : '0.75rem',
            color: borderColor,
            opacity: p.opacity,
            transform: `translate(-50%, -50%) scale(${p.scale})`,
            textShadow: `0 0 8px ${glowColor}`,
            userSelect: 'none',
            lineHeight: 1,
            willChange: 'transform, opacity',
          }}
        >
          {p.char}
        </div>
      ))}
    </>
  );
}


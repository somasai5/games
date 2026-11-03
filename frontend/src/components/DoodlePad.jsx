import { useState, useRef, useEffect } from 'react';
import { sounds } from '../utils/audio';

export default function DoodlePad({ onSendDoodle, incomingDoodle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [color, setColor] = useState('#00ffcc');
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef(null);
  const strokeBuffer = useRef([]);

  // Draw incoming opponent strokes in real-time
  useEffect(() => {
    if (!incomingDoodle) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (incomingDoodle.clear) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    if (incomingDoodle.points && incomingDoodle.points.length > 1) {
      ctx.strokeStyle = incomingDoodle.color || '#ff6b8b';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(incomingDoodle.points[0].x, incomingDoodle.points[0].y);
      for (let i = 1; i < incomingDoodle.points.length; i++) {
        ctx.lineTo(incomingDoodle.points[i].x, incomingDoodle.points[i].y);
      }
      ctx.stroke();
    }
  }, [incomingDoodle]);

  const startDrawing = (e) => {
    isDrawing.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    lastPoint.current = { x, y };
    strokeBuffer.current = [{ x, y }];
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPoint.current = { x, y };
    strokeBuffer.current.push({ x, y });

    // Stream strokes in batches of 6 points to opponent
    if (strokeBuffer.current.length >= 6) {
      onSendDoodle?.(strokeBuffer.current, color, false);
      strokeBuffer.current = [{ x, y }];
    }
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (strokeBuffer.current.length > 0) {
      onSendDoodle?.(strokeBuffer.current, color, false);
      strokeBuffer.current = [];
    }
  };

  const clearCanvas = () => {
    sounds.playClick();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onSendDoodle?.([], color, true);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => {
          sounds.playClick();
          setIsOpen(!isOpen);
        }}
        title="Open live shared doodle pad"
        style={{
          position: 'fixed',
          bottom: '4.8rem',
          left: '1.25rem',
          zIndex: 9980,
          background: 'var(--card-bg)',
          border: '1px solid var(--accent)',
          color: 'var(--accent)',
          borderRadius: '24px',
          padding: '6px 14px',
          fontSize: '0.75rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(10px)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <span>🎨</span>
        <span>{isOpen ? 'CLOSE DOODLE' : 'DOODLE'}</span>
      </button>

      {/* Floating Canvas Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '7.8rem',
            left: '1.25rem',
            zIndex: 9985,
            background: 'rgba(15, 20, 28, 0.95)',
            border: '1px solid var(--accent)',
            borderRadius: '16px',
            padding: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px var(--accent-dim)',
            backdropFilter: 'blur(16px)',
            animation: 'fadeIn 0.25s ease-out',
            maxWidth: '300px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.1em' }}>
              LIVE SHARED DOODLE
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['#ff6b8b', '#00ffcc', '#ffd166', '#c084fc', '#ffffff'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '2px solid #fff' : 'none',
                    cursor: 'pointer',
                    boxShadow: color === c ? '0 0 8px ' + c : 'none',
                  }}
                />
              ))}
              <button
                type="button"
                onClick={clearCanvas}
                style={{
                  background: 'rgba(255,71,87,0.2)',
                  border: '1px solid var(--error)',
                  color: 'var(--error)',
                  borderRadius: '6px',
                  padding: '1px 6px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginLeft: '4px',
                }}
              >
                CLEAR
              </button>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={280}
            height={180}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{
              background: 'rgba(5, 7, 10, 0.9)',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              cursor: 'crosshair',
              touchAction: 'none',
              display: 'block',
            }}
          />
          <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '6px' }}>
            Both players see drawings live in real time! ✨
          </div>
        </div>
      )}
    </>
  );
}


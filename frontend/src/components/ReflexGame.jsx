import { useState, useRef, useEffect } from 'react';
import { sounds } from '../utils/audio';

export default function ReflexGame() {
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'waiting' | 'ready' | 'result' | 'early'
  const [reactionTime, setReactionTime] = useState(null);
  const [bestTime, setBestTime] = useState(() => {
    return parseInt(localStorage.getItem('sk_best_reflex')) || null;
  });

  const startTimeRef = useRef(0);
  const timerRef = useRef(null);

  const startTest = () => {
    sounds.playClick();
    setGameState('waiting');
    setReactionTime(null);

    // Random delay between 1.5s and 4s
    const delay = Math.floor(Math.random() * 2500) + 1500;
    timerRef.current = setTimeout(() => {
      startTimeRef.current = performance.now();
      setGameState('ready');
    }, delay);
  };

  const handleClickBox = () => {
    if (gameState === 'idle' || gameState === 'result' || gameState === 'early') {
      startTest();
    } else if (gameState === 'waiting') {
      clearTimeout(timerRef.current);
      setGameState('early');
      sounds.playLoss();
    } else if (gameState === 'ready') {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      sounds.playReflex();
      setReactionTime(elapsed);
      setGameState('result');

      if (!bestTime || elapsed < bestTime) {
        setBestTime(elapsed);
        localStorage.setItem('sk_best_reflex', elapsed);
      }
    }
  };

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  let bgColor = 'var(--input-bg)';
  let borderColor = 'var(--border)';
  let message = '⚡ TAP TO TEST REFLEXES';
  let subMessage = 'Measure your reaction time in milliseconds!';

  if (gameState === 'waiting') {
    bgColor = 'rgba(255, 71, 87, 0.15)';
    borderColor = 'var(--error)';
    message = '🔴 WAIT FOR GREEN…';
    subMessage = 'Do not tap yet!';
  } else if (gameState === 'ready') {
    bgColor = 'rgba(0, 255, 204, 0.35)';
    borderColor = 'var(--accent)';
    message = '🟢 TAP NOW!!';
    subMessage = 'QUICK!';
  } else if (gameState === 'early') {
    bgColor = 'rgba(255, 71, 87, 0.25)';
    borderColor = 'var(--error)';
    message = '⚠️ TOO EARLY!';
    subMessage = 'Tap to try again';
  } else if (gameState === 'result') {
    bgColor = 'var(--accent-dim)';
    borderColor = 'var(--accent)';
    message = `⚡ ${reactionTime} ms`;
    subMessage = reactionTime < 200 ? '🏆 GODLIKE REFLEXES!' : reactionTime < 280 ? '⚡ LIGHTNING FAST!' : '👍 SOLID REACTION!';
  }

  return (
    <div style={{ marginTop: '1.2rem', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
      <div
        onClick={handleClickBox}
        style={{
          background: bgColor,
          border: `2px dashed ${borderColor}`,
          borderRadius: '16px',
          padding: '1.25rem',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: gameState === 'ready' ? '0 0 25px var(--accent-glow)' : 'none',
          userSelect: 'none',
        }}
      >
        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: gameState === 'ready' ? 'var(--accent)' : 'var(--text)', letterSpacing: '0.08em', marginBottom: '4px' }}>
          {message}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {subMessage}
        </div>
        {bestTime && (
          <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 700, marginTop: '8px' }}>
            👑 PERSONAL BEST: {bestTime} ms
          </div>
        )}
      </div>
    </div>
  );
}


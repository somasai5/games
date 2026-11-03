import { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';

export default function MascotCompanion({ theme = 'cyber', screen = 'lobby', isMyTurn = false, won = false }) {
  const [bouncing, setBouncing] = useState(false);
  const [bubbleText, setBubbleText] = useState('');
  const [visible, setVisible] = useState(true);

  // Character and personality based on theme
  let mascotIcon = '🤖';
  let mascotName = 'CYBER BOT';
  if (theme === 'sweethearts') {
    mascotIcon = '🧸';
    mascotName = 'TEDDY';
  } else if (theme === 'sakura') {
    mascotIcon = '🐱';
    mascotName = 'SAKURA KITTY';
  } else if (theme === 'matrix') {
    mascotIcon = '📟';
    mascotName = 'HACKER';
  }

  // Reactive speech comments based on game phase
  useEffect(() => {
    let text = 'Ready to play! ⚡';
    if (screen === 'waiting') {
      text = theme === 'sweethearts' ? 'Waiting for your favorite person! 🧸' : 'Awaiting challenger connection… 📡';
    } else if (screen === 'setup') {
      text = 'Pick a tricky code they’ll never guess! 🤫';
    } else if (screen === 'game') {
      if (isMyTurn) {
        text = 'Your turn! Focus on the Bulls & Cows! 🎯';
      } else {
        text = 'Opponent is thinking hard… 🧠';
      }
    } else if (screen === 'result') {
      text = won ? 'VICTORY! Incredible mastermind! 🏆' : 'Great battle! Time for a rematch! 🔥';
    }
    setBubbleText(text);
  }, [screen, isMyTurn, won, theme]);

  const handleMascotClick = () => {
    sounds.playMascot();
    setBouncing(true);
    setTimeout(() => setBouncing(false), 600);

    const funnyReplies = [
      'Hehe, that tickles! ✨',
      'I believe in your brainpower! 🧠',
      'Guaranteed +10 Luck boost! 🍀',
      'Let’s get this win! 🔥',
    ];
    setBubbleText(funnyReplies[Math.floor(Math.random() * funnyReplies.length)]);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '4.8rem',
        right: '1.25rem',
        zIndex: 9980,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      {/* Speech Bubble */}
      {bubbleText && (
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--accent)',
            color: 'var(--text)',
            padding: '6px 12px',
            borderRadius: '14px 14px 2px 14px',
            fontSize: '0.74rem',
            fontWeight: 600,
            maxWidth: '210px',
            marginBottom: '6px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.3s ease-out',
            textAlign: 'right',
            lineHeight: 1.3,
          }}
        >
          {bubbleText}
        </div>
      )}

      {/* Mascot Avatar with Bounce Animation */}
      <div
        onClick={handleMascotClick}
        title={`Click ${mascotName} for good luck!`}
        style={{
          width: '46px',
          height: '46px',
          background: 'var(--input-bg)',
          border: '2px solid var(--accent)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.6rem',
          cursor: 'pointer',
          boxShadow: '0 0 16px var(--accent-glow)',
          transform: bouncing ? 'scale(1.25) rotate(15deg)' : 'scale(1)',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {mascotIcon}
      </div>
    </div>
  );
}


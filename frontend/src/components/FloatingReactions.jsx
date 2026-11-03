import { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';

const REACTION_EMOJIS = ['🧸', '💖', '✨', '🥺', '💌', '🌸', '🎉', '🐱'];

export default function FloatingReactions({ onSendReaction, incomingReaction }) {
  const [activeParticles, setActiveParticles] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Helper to spawn a floating emoji burst
  const spawnEmoji = (emoji, isOpponent = false, senderName = '') => {
    const id = Date.now() + Math.random();
    // Randomize initial horizontal position around center/random
    const leftPercent = isOpponent ? 25 + Math.random() * 50 : 35 + Math.random() * 30;
    const swayX = (Math.random() - 0.5) * 80;

    const newParticle = {
      id,
      emoji,
      left: `${leftPercent}vw`,
      bottom: '15vh',
      swayX: `${swayX}px`,
    };

    setActiveParticles(prev => [...prev.slice(-15), newParticle]);

    if (isOpponent) {
      sounds.playSparkle();
      setToastMessage(`${senderName || 'Opponent'} sent you ${emoji}!`);
      setTimeout(() => setToastMessage(null), 2500);
    } else {
      sounds.playHeart();
    }

    setTimeout(() => {
      setActiveParticles(prev => prev.filter(p => p.id !== id));
    }, 2400);
  };

  // React to incoming opponent reactions passed via props
  useEffect(() => {
    if (incomingReaction && incomingReaction.emoji) {
      spawnEmoji(incomingReaction.emoji, true, incomingReaction.senderName);
    }
  }, [incomingReaction]);

  const handleSend = (emoji) => {
    spawnEmoji(emoji, false);
    if (onSendReaction) {
      onSendReaction(emoji);
    }
  };

  return (
    <>
      {/* Toast banner when opponent reacts */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '4.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--card-bg)',
            border: '1px solid var(--accent)',
            color: 'var(--text)',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: '0 4px 20px var(--accent-glow)',
            zIndex: 9995,
            animation: 'fadeIn 0.3s ease-out',
            pointerEvents: 'none',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Floating emoji particles */}
      {activeParticles.map(p => (
        <div
          key={p.id}
          className="floating-emoji-item"
          style={{
            left: p.left,
            bottom: p.bottom,
            '--sway-x': p.swayX,
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* Reaction Sender Dock (with Minimize toggle) */}
      {isMinimized ? (
        <button
          type="button"
          className="reaction-minimized-pill"
          onClick={() => {
            sounds.playClick();
            setIsMinimized(false);
          }}
          title="Open live reactions bar"
        >
          <span>💬</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em' }}>
            REACTIONS
          </span>
          <span>💖</span>
        </button>
      ) : (
        <div className="reaction-bar-container" title="Send a live cute reaction!">
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', marginRight: '2px' }}>
            SEND:
          </span>
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="reaction-btn"
              onClick={() => handleSend(emoji)}
              aria-label={`Send reaction ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setIsMinimized(true);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              marginLeft: '4px',
              padding: '3px 7px',
              borderRadius: '12px',
              fontWeight: 700,
              transition: 'all 0.15s',
            }}
            title="Minimize reactions bar"
            aria-label="Minimize"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

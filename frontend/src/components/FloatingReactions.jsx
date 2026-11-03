import { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';

const REACTION_EMOJIS = ['🧸', '💖', '✨', '🥺', '💌', '🌸', '🎉', '🐱'];
const QUICK_TAUNTS = ['🧠 Big Brain', '🔥 So Close!', '🎯 GG!', '😱 No Way!', '⚡ Move!'];

export default function FloatingReactions({ onSendReaction, incomingReaction, onSendQuickChat, incomingQuickChat }) {
  const [activeParticles, setActiveParticles] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTaunts, setShowTaunts] = useState(false);

  // Helper to spawn a floating emoji or text bubble
  const spawnEmoji = (emoji, isOpponent = false, senderName = '') => {
    const id = Date.now() + Math.random();
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
      setToastMessage(`${senderName || 'Opponent'} sent ${emoji}!`);
      setTimeout(() => setToastMessage(null), 2500);
    } else {
      sounds.playHeart();
    }

    setTimeout(() => {
      setActiveParticles(prev => prev.filter(p => p.id !== id));
    }, 2400);
  };

  // React to incoming opponent reactions
  useEffect(() => {
    if (incomingReaction && incomingReaction.emoji) {
      spawnEmoji(incomingReaction.emoji, true, incomingReaction.senderName);
    }
  }, [incomingReaction]);

  // React to incoming opponent quick chat
  useEffect(() => {
    if (incomingQuickChat && incomingQuickChat.text) {
      sounds.playTaunt();
      spawnEmoji(incomingQuickChat.text, true, incomingQuickChat.senderName);
      setToastMessage(`${incomingQuickChat.senderName || 'Opponent'}: "${incomingQuickChat.text}"`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  }, [incomingQuickChat]);

  const handleSendEmoji = (emoji) => {
    spawnEmoji(emoji, false);
    onSendReaction?.(emoji);
  };

  const handleSendTaunt = (text) => {
    sounds.playTaunt();
    spawnEmoji(text, false);
    onSendQuickChat?.(text);
    setShowTaunts(false);
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
            padding: '6px 18px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 700,
            boxShadow: '0 4px 20px var(--accent-glow)',
            zIndex: 9995,
            animation: 'fadeIn 0.3s ease-out',
            pointerEvents: 'none',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Floating emoji and taunt particles */}
      {activeParticles.map(p => (
        <div
          key={p.id}
          className="floating-emoji-item"
          style={{
            left: p.left,
            bottom: p.bottom,
            '--sway-x': p.swayX,
            fontSize: p.emoji.length > 4 ? '1.2rem' : '2.2rem',
            background: p.emoji.length > 4 ? 'var(--card-bg)' : 'transparent',
            padding: p.emoji.length > 4 ? '4px 12px' : 0,
            borderRadius: p.emoji.length > 4 ? '16px' : 0,
            border: p.emoji.length > 4 ? '1px solid var(--accent)' : 'none',
            color: 'var(--accent)',
            fontWeight: 800,
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* Reaction Sender Dock */}
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
            CHAT &amp; EMOTES
          </span>
          <span>✨</span>
        </button>
      ) : (
        <div className="reaction-bar-container" title="Send a reaction or quick chat!">
          {/* Quick Chat Picker Popover */}
          {showTaunts && (
            <div
              style={{
                position: 'absolute',
                bottom: '110%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(15, 20, 28, 0.95)',
                border: '1px solid var(--accent)',
                padding: '8px',
                borderRadius: '16px',
                display: 'flex',
                gap: '6px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(16px)',
                flexWrap: 'wrap',
                width: 'max-content',
                maxWidth: '320px',
                justifyContent: 'center',
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              {QUICK_TAUNTS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleSendTaunt(t)}
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    borderRadius: '12px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setShowTaunts(!showTaunts);
            }}
            style={{
              background: showTaunts ? 'var(--accent)' : 'var(--input-bg)',
              color: showTaunts ? '#000' : 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: '14px',
              padding: '2px 8px',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              marginRight: '4px',
            }}
          >
            💬 TAUNT
          </button>

          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="reaction-btn"
              onClick={() => handleSendEmoji(emoji)}
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

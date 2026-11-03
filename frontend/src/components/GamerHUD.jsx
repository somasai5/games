import { useState } from 'react';
import { sounds } from '../utils/audio';

export default function GamerHUD({ playerName, playerAvatar = '⚡', roomCode, currentTheme, onThemeChange }) {
  const [muted, setMuted] = useState(sounds.isMuted());
  const [volume, setVol] = useState(sounds.getVolume());

  const handleToggleSound = () => {
    const next = sounds.toggleMute();
    setMuted(next);
    if (!next) sounds.playClick();
  };

  const handleVolUp = () => {
    const next = sounds.setVolume(Math.min(1, volume + 0.2));
    setVol(next);
    sounds.playClick();
  };

  const handleVolDown = () => {
    const next = sounds.setVolume(Math.max(0.1, volume - 0.2));
    setVol(next);
    sounds.playClick();
  };

  const themes = [
    { id: 'cyber', label: '⚡ CYBER', color: '#00ffcc' },
    { id: 'synthwave', label: '🌅 SYNTHWAVE', color: '#ff007f' },
    { id: 'matrix', label: '📟 MATRIX', color: '#00ff66' },
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.6rem 1.25rem',
      background: 'rgba(5, 7, 10, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      zIndex: 9000,
      fontSize: '0.72rem',
      letterSpacing: '0.12em',
      fontFamily: "'Inter', sans-serif",
      flexWrap: 'wrap',
      gap: '0.6rem',
    }}>
      {/* Left: Telemetry & Connection */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: '0 0 10px var(--accent)',
            display: 'inline-block',
          }} />
          <span style={{ color: 'var(--accent)', fontWeight: '800' }}>ONLINE</span>
        </div>
        <span style={{ color: 'var(--text-dim)' }}>|</span>
        <span style={{ color: 'var(--text-muted)' }}>PING: <strong style={{ color: '#fff' }}>14ms</strong></span>
        {roomCode && (
          <>
            <span style={{ color: 'var(--text-dim)' }}>|</span>
            <span style={{ color: 'var(--text-muted)' }}>ROOM: <strong style={{ color: 'var(--accent)' }}>{roomCode}</strong></span>
          </>
        )}
      </div>

      {/* Center: Theme Selector Mode Switcher */}
      <div style={{
        display: 'inline-flex',
        background: 'rgba(0, 0, 0, 0.45)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '2px',
        gap: '3px',
      }}>
        {themes.map(t => (
          <button
            key={t.id}
            onClick={() => {
              sounds.playHover();
              onThemeChange(t.id);
            }}
            style={{
              background: currentTheme === t.id ? t.color : 'transparent',
              color: currentTheme === t.id ? '#000' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '16px',
              padding: '0.28rem 0.65rem',
              fontSize: '0.68rem',
              fontWeight: '800',
              cursor: 'pointer',
              letterSpacing: '0.08em',
              transition: 'all 0.25s',
              boxShadow: currentTheme === t.id ? `0 0 12px ${t.color}` : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Right: Player Tag + Sound & Volume Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {playerName && (
          <div style={{
            background: 'var(--accent-dim)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '0.25rem 0.75rem',
            color: 'var(--text)',
            fontSize: '0.72rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            <span>{playerAvatar}</span>
            <span style={{ color: 'var(--accent)' }}>{playerName}</span>
          </div>
        )}

        {/* Audio Volume & Mute Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '2px 6px',
        }}>
          <button
            onClick={handleToggleSound}
            title={muted ? 'Unmute' : 'Mute'}
            style={{
              background: 'transparent',
              border: 'none',
              color: muted ? 'var(--text-dim)' : 'var(--accent)',
              cursor: 'pointer',
              fontSize: '0.78rem',
              padding: '2px',
            }}
          >
            {muted ? '🔇' : '🔊'}
          </button>

          {!muted && (
            <>
              <button
                onClick={handleVolDown}
                title="Decrease Volume"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: '1px 3px',
                }}
              >
                -
              </button>
              <span style={{ color: 'var(--accent)', fontSize: '0.68rem', fontWeight: '700' }}>
                {Math.round(volume * 100)}%
              </span>
              <button
                onClick={handleVolUp}
                title="Increase Volume"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: '1px 3px',
                }}
              >
                +
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

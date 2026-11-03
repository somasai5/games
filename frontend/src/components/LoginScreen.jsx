import { useState } from 'react';
import TiltCard from './TiltCard';
import { sounds } from '../utils/audio';

const AVATARS = ['⚡', '🤖', '🐉', '🦊', '💀', '🎯'];

export default function LoginScreen({ onStart }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('⚡');

  const handleSelectAvatar = (av) => {
    sounds.playHover();
    setAvatar(av);
  };

  const handle = () => {
    const n = name.trim();
    if (n) {
      sounds.playLockIn();
      onStart(n.toUpperCase(), avatar);
    }
  };

  return (
    <div className="screen fade-in">
      {/* Hero with glowing pulse & gamer badges */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 className="title-hero" data-text="SAI & KANNA">SAI &amp; KANNA</h1>
        <p className="title-sub">DIGIT GUESSING GAME</p>
        <div style={{
          display: 'inline-flex',
          gap: '0.6rem',
          marginTop: '1rem',
          background: 'var(--accent-dim)',
          border: '1px solid var(--border)',
          padding: '0.35rem 1rem',
          borderRadius: '20px',
          fontSize: '0.72rem',
          letterSpacing: '0.14em',
          color: 'var(--accent)',
          fontWeight: '800',
        }}>
          <span>⚡ REALTIME 1V1</span>
          <span>•</span>
          <span>🐂 BULLS &amp; COWS</span>
          <span>•</span>
          <span>🏆 PRO RANKED</span>
        </div>
      </div>

      {/* 3D Tilt Cyber Card */}
      <TiltCard style={{ width: '100%', maxWidth: '360px' }}>
        <p className="section-label">SELECT AVATAR</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '1.25rem' }}>
          {AVATARS.map((av) => (
            <button
              key={av}
              type="button"
              className={`avatar-btn ${avatar === av ? 'selected' : ''}`}
              onClick={() => handleSelectAvatar(av)}
            >
              {av}
            </button>
          ))}
        </div>

        <p className="section-label">ENTER CODENAME</p>
        <input
          className="input"
          type="text"
          placeholder="PLAYER NAME"
          value={name}
          onChange={(e) => {
            sounds.playKeypress();
            setName(e.target.value);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handle()}
          maxLength={18}
          autoFocus
          style={{ marginBottom: '1.4rem' }}
        />
        <button
          className="btn-primary"
          onClick={handle}
          disabled={!name.trim()}
          style={{ cursor: name.trim() ? 'pointer' : 'not-allowed' }}
        >
          START MISSION →
        </button>
      </TiltCard>
    </div>
  );
}

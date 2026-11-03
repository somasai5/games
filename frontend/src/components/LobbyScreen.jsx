import { useState } from 'react';
import TiltCard from './TiltCard';
import { sounds } from '../utils/audio';

export default function LobbyScreen({ playerName, error, onCreateRoom, onJoinRoom }) {
  const [selectedDigits, setSelectedDigits] = useState(4);
  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [code, setCode] = useState('');

  const handleSelectDigits = (d) => {
    sounds.playHover();
    setSelectedDigits(d);
  };

  const handleToggleDuplicates = () => {
    sounds.playClick();
    setAllowDuplicates(!allowDuplicates);
  };

  const handleCreate = () => {
    sounds.playLockIn();
    onCreateRoom(selectedDigits, allowDuplicates);
  };

  const handleJoin = () => {
    if (!code.trim()) return;
    sounds.playClick();
    onJoinRoom(code.trim());
  };

  return (
    <div className="screen fade-in">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 className="welcome-title">WELCOME, {playerName}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.12em', marginTop: '0.6rem' }}>
          CHOOSE AN OPTION TO START YOUR MATCH
        </p>
      </div>

      {/* Cards row with 3D Tilt */}
      <div style={{
        display: 'flex', gap: '1.75rem', flexWrap: 'wrap',
        justifyContent: 'center', width: '100%', maxWidth: '720px',
      }}>

        {/* ── CREATE ROOM ── */}
        <TiltCard style={{ flex: 1, minWidth: '290px', maxWidth: '340px' }}>
          <div className="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2"/>
              <path d="M12 12h.01M7 12h.01M17 12h.01M7 9v6M10 10.5h.01M10 13.5h.01"/>
            </svg>
            Create Room
          </div>

          <p className="section-label">Number of Digits (1-6)</p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.3rem', justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5, 6].map((d) => (
              <button
                key={d}
                className={`digit-btn ${selectedDigits === d ? 'active' : ''}`}
                onClick={() => handleSelectDigits(d)}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Repeat Digits Mode Toggle */}
          <div style={{ marginBottom: '1.4rem' }}>
            <p className="section-label">DUPLICATE DIGITS</p>
            <button
              type="button"
              onClick={handleToggleDuplicates}
              style={{
                width: '100%',
                background: allowDuplicates ? 'var(--accent-dim)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${allowDuplicates ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '8px',
                padding: '0.55rem',
                color: allowDuplicates ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '0.74rem',
                fontWeight: '800',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'all 0.25s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <span>{allowDuplicates ? '⚡ ALLOW REPEATS (e.g. 1122)' : '🔒 UNIQUE ONLY (No repeats)'}</span>
            </button>
          </div>

          <button className="btn-primary" onClick={handleCreate}>
            CREATE ROOM ⚡
          </button>
        </TiltCard>

        {/* ── JOIN ROOM ── */}
        <TiltCard style={{ flex: 1, minWidth: '290px', maxWidth: '340px' }}>
          <div className="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Join Room
          </div>

          <p className="section-label">Enter Room Code</p>
          <input
            className="input"
            type="text"
            placeholder="ABC123"
            value={code}
            onChange={(e) => {
              sounds.playKeypress();
              setCode(e.target.value.toUpperCase());
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            maxLength={6}
            style={{ marginBottom: '0.6rem' }}
          />

          {error && <p className="error-msg" style={{ marginBottom: '0.6rem' }}>{error}</p>}

          <button
            className="btn-outline"
            onClick={handleJoin}
            disabled={!code.trim()}
            style={{ marginTop: error ? '0' : '0.4rem' }}
          >
            JOIN ROOM →
          </button>
        </TiltCard>
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';
import TiltCard from './TiltCard';
import CuteWaitingToy from './CuteWaitingToy';
import { sounds } from '../utils/audio';

function DigitBoxes({ count, values, onChange, onEnter, disabled }) {
  const boxSize = Math.min(58, Math.floor((Math.min(window.innerWidth - 80, 340) - (count - 1) * 10) / count));

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    sounds.playKeypress();
    onChange(i, val);
    if (val && i < count - 1) document.getElementById(`setup-${i + 1}`)?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) {
      document.getElementById(`setup-${i - 1}`)?.focus();
    }
    if (e.key === 'Enter') onEnter?.();
  };

  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
      {values.map((v, i) => (
        <input
          key={i}
          id={`setup-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={v}
          disabled={disabled}
          autoFocus={i === 0}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={`digit-input ${v ? 'filled' : ''}`}
          style={{ width: boxSize, height: boxSize + 8, fontSize: Math.min(1.6, boxSize / 32) + 'rem' }}
        />
      ))}
    </div>
  );
}

export default function SetupScreen({
  numDigits, allowDuplicates = true, playerName, opponentName,
  iAmReady, opponentReady, onSetSecret,
}) {
  const [digits, setDigits] = useState(Array(numDigits).fill(''));
  const [error, setError] = useState('');

  const hasDuplicates = !allowDuplicates && new Set(digits.filter(d => d !== '')).size !== digits.filter(d => d !== '').length;

  const setDigit = useCallback((i, val) => {
    setDigits(prev => { const next = [...prev]; next[i] = val; return next; });
  }, []);

  const handleLockIn = () => {
    const secret = digits.join('');
    if (digits.some(d => d === '')) {
      return setError(`Please fill in all ${numDigits} digits`);
    }
    if (!allowDuplicates && new Set(digits).size !== numDigits) {
      return setError('Duplicate digits are not allowed! Each digit must be unique.');
    }
    setError('');
    sounds.playLockIn();
    onSetSecret(secret);
  };

  return (
    <div className="screen fade-in">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 className="welcome-title" style={{ marginBottom: '0.5rem' }}>SET SECRET CODE</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', letterSpacing: '0.12em' }}>
          CHOOSE A {numDigits}-DIGIT CODE FOR{' '}
          <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{opponentName || 'YOUR OPPONENT'}</span> TO GUESS
        </p>
      </div>

      {/* Input card with 3D Tilt */}
      <TiltCard style={{ width: '100%', maxWidth: '420px', textAlign: 'center', marginBottom: '1.75rem' }}>
        <p className="section-label" style={{ marginBottom: '1.3rem' }}>YOUR ENCRYPTED CODE</p>

        <div style={{ marginBottom: '1.4rem' }}>
          <DigitBoxes
            count={numDigits}
            values={digits}
            onChange={setDigit}
            onEnter={handleLockIn}
            disabled={iAmReady}
          />
        </div>

        {hasDuplicates && (
          <p className="error-msg" style={{ marginBottom: '0.75rem' }}>
            ⚠️ Repeated digits detected! Each digit must be unique.
          </p>
        )}
        {error && !hasDuplicates && <p className="error-msg" style={{ marginBottom: '0.75rem' }}>{error}</p>}

        <p style={{
          fontSize: '0.7rem',
          color: allowDuplicates ? 'var(--accent)' : 'var(--gold)',
          fontWeight: '700',
          letterSpacing: '0.1em',
          marginBottom: '1rem',
        }}>
          {allowDuplicates ? '⚡ REPEATED DIGITS ALLOWED' : '🔒 UNIQUE DIGITS ONLY (NO REPEATS)'}
        </p>

        {!iAmReady ? (
          <button
            className="btn-primary"
            onClick={handleLockIn}
            disabled={digits.some(d => d === '') || hasDuplicates}
          >
            LOCK IN SECRET 🔒
          </button>
        ) : (
          <div style={{
            padding: '0.9rem',
            border: '1px solid var(--accent)',
            borderRadius: '8px',
            color: 'var(--accent)',
            fontSize: '0.85rem',
            fontWeight: '800',
            letterSpacing: '0.18em',
            boxShadow: '0 0 20px rgba(0, 255, 204, 0.35)',
            background: 'var(--accent-dim)',
          }}>
            ✓ CODE ENCRYPTED &amp; LOCKED
          </div>
        )}

        {iAmReady && !opponentReady && (
          <div style={{ marginTop: '0.9rem' }}>
            <p className="pulse" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.8rem', letterSpacing: '0.08em' }}>
              Waiting for {opponentName} to lock in their secret…
            </p>
            <CuteWaitingToy title="WAITING ZONE: RELAX &amp; POP" />
          </div>
        )}
        {iAmReady && opponentReady && (
          <p style={{ color: 'var(--accent)', fontSize: '0.82rem', marginTop: '0.9rem', letterSpacing: '0.12em', fontWeight: '700' }}>
            ⚡ BOTH READY! LAUNCHING MATCH…
          </p>
        )}
      </TiltCard>

      {/* Ready status pills */}
      <div style={{ display: 'flex', gap: '0.85rem' }}>
        <div className={`ready-pill ${iAmReady ? 'ready' : ''}`}>
          {playerName}: {iAmReady ? '✓ LOCKED' : 'CHOOSING…'}
        </div>
        <div className={`ready-pill ${opponentReady ? 'ready' : ''}`}>
          {opponentName || 'Opponent'}: {opponentReady ? '✓ LOCKED' : 'CHOOSING…'}
        </div>
      </div>

      {/* Tactical Hint */}
      <p style={{ marginTop: '2.5rem', color: 'var(--text-dim)', fontSize: '0.72rem', letterSpacing: '0.08em', textAlign: 'center', maxWidth: '320px' }}>
        🐂 <strong>Bulls</strong> = correct digit &amp; spot &nbsp;|&nbsp; 🐄 <strong>Cows</strong> = correct digit, wrong spot
      </p>
    </div>
  );
}

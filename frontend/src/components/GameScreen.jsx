import { useState, useRef, useEffect } from 'react';
import TiltCard from './TiltCard';
import { sounds } from '../utils/audio';

// ── Turn Timer ─────────────────────────────────────────────────────────────
function TurnTimer({ isMyTurn, onTimeout, seconds = 60 }) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    setTimeLeft(seconds);
    if (!isMyTurn) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isMyTurn, seconds]);

  if (!isMyTurn) return null;

  const pct = (timeLeft / seconds) * 100;
  const urgent = timeLeft <= 10;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.6rem' }}>
      <div style={{
        flex: 1, height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: urgent ? 'var(--error)' : 'var(--accent)',
          boxShadow: urgent ? '0 0 10px var(--error)' : '0 0 10px var(--accent)',
          transition: 'width 1s linear, background 0.3s',
        }} />
      </div>
      <span style={{
        fontSize: '0.8rem',
        fontWeight: '800',
        color: urgent ? 'var(--error)' : 'var(--text-muted)',
        letterSpacing: '0.05em',
        minWidth: '32px',
        transition: 'color 0.3s',
      }}>
        {timeLeft}s
      </span>
    </div>
  );
}

// ── Digit Scratchpad ───────────────────────────────────────────────────────
function DigitScratchpad({ myGuesses }) {
  const digitState = {};
  for (let d = 0; d <= 9; d++) digitState[d] = 'unknown';

  for (const g of myGuesses) {
    const guessArr = g.guess.split('');
    const totalHits = g.bulls + g.cows;

    if (totalHits === 0) {
      guessArr.forEach(d => {
        if (digitState[d] !== 'confirmed') digitState[d] = 'wrong';
      });
    } else {
      guessArr.forEach(d => {
        if (digitState[d] === 'unknown') digitState[d] = 'maybe';
      });
    }

    if (g.bulls === guessArr.length) {
      guessArr.forEach(d => { digitState[d] = 'confirmed'; });
    }
  }

  const colors = {
    unknown: { bg: 'var(--input-bg)', border: 'var(--border)', color: 'var(--text-dim)' },
    wrong: { bg: '#1c0808', border: '#4d1414', color: '#7a3838', textDecoration: 'line-through' },
    maybe: { bg: 'rgba(255,215,0,0.08)', border: 'rgba(255,215,0,0.3)', color: 'var(--gold)' },
    confirmed: { bg: 'var(--accent-dim)', border: 'var(--accent)', color: 'var(--accent)' },
  };

  return (
    <div style={{ marginBottom: '1.2rem' }}>
      <p className="section-label" style={{ marginBottom: '0.5rem' }}>
        🔍 DIGIT TRACKER
      </p>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => {
          const state = digitState[d];
          const style = colors[state];
          return (
            <div
              key={d}
              onMouseEnter={() => sounds.playHover()}
              style={{
                width: '30px', height: '30px',
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: '6px',
                color: style.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: '800',
                textDecoration: style.textDecoration || 'none',
                transition: 'all 0.25s',
                cursor: 'default',
                boxShadow: state === 'confirmed' ? '0 0 10px rgba(0,255,204,0.4)' : 'none',
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.4rem', letterSpacing: '0.06em' }}>
        <span style={{ color: 'var(--accent)' }}>■</span> in secret &nbsp;
        <span style={{ color: 'var(--gold)' }}>■</span> candidate &nbsp;
        <span style={{ color: '#7a3838' }}>■</span> eliminated
      </p>
    </div>
  );
}

// ── Guess Row ──────────────────────────────────────────────────────────────
function GuessRow({ entry, numDigits }) {
  const isWin = entry.bulls === numDigits;
  return (
    <div className={`guess-row ${isWin ? 'win' : ''}`}>
      <span className="guess-number" style={{ color: isWin ? 'var(--accent)' : 'var(--text)' }}>
        {entry.guess}
      </span>
      <div className="guess-badges">
        <span title="Bulls – correct digit & position">
          🐂 <strong style={{ color: 'var(--accent)' }}>{entry.bulls}</strong>
        </span>
        <span title="Cows – correct digit, wrong position">
          🐄 <strong style={{ color: 'var(--gold)' }}>{entry.cows}</strong>
        </span>
      </div>
    </div>
  );
}

// ── Guess Input ────────────────────────────────────────────────────────────
function GuessInput({ numDigits, allowDuplicates = true, onGuess, disabled }) {
  const [digits, setDigits] = useState(Array(numDigits).fill(''));
  const [error, setError] = useState('');

  const hasDuplicates = !allowDuplicates && new Set(digits.filter(d => d !== '')).size !== digits.filter(d => d !== '').length;

  const boxSize = Math.min(52, Math.floor(
    (Math.min(typeof window !== 'undefined' ? window.innerWidth / 2 - 60 : 240, 290) - (numDigits - 1) * 8) / numDigits
  ));

  const setDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    sounds.playKeypress();
    const next = [...digits]; next[i] = val; setDigits(next);
    if (val && i < numDigits - 1) document.getElementById(`guess-${i + 1}`)?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) document.getElementById(`guess-${i - 1}`)?.focus();
    if (e.key === 'Enter') submit();
  };

  const appendVirtualDigit = (d) => {
    if (disabled) return;
    const firstEmpty = digits.findIndex(v => v === '');
    if (firstEmpty !== -1) {
      setDigit(firstEmpty, String(d));
    }
  };

  const handleBackspace = () => {
    sounds.playClick();
    const lastFilled = digits.map((v, i) => (v !== '' ? i : -1)).filter(i => i !== -1).pop();
    if (lastFilled !== undefined) {
      const next = [...digits];
      next[lastFilled] = '';
      setDigits(next);
      document.getElementById(`guess-${lastFilled}`)?.focus();
    }
  };

  const submit = () => {
    if (digits.some(d => d === '')) return setError(`Fill all ${numDigits} digits`);
    if (!allowDuplicates && new Set(digits).size !== numDigits) {
      return setError('Repeated digits are not allowed in this room!');
    }
    setError('');
    sounds.playLockIn();
    const guess = digits.join('');
    setDigits(Array(numDigits).fill(''));
    setTimeout(() => document.getElementById('guess-0')?.focus(), 50);
    onGuess(guess);
  };

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '0.65rem' }}>
        {digits.map((d, i) => (
          <input
            key={i}
            id={`guess-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            disabled={disabled}
            autoFocus={i === 0}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`digit-input ${d ? 'filled' : ''}`}
            style={{ width: boxSize, height: boxSize + 6, fontSize: Math.min(1.3, boxSize / 34) + 'rem' }}
          />
        ))}
      </div>

      {/* Mini Tactical Virtual Numpad */}
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => appendVirtualDigit(n)}
            style={{
              width: '28px', height: '28px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '5px',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={handleBackspace}
          style={{
            padding: '0 8px', height: '28px',
            background: 'rgba(255,71,87,0.1)',
            border: '1px solid rgba(255,71,87,0.25)',
            borderRadius: '5px',
            color: 'var(--error)',
            fontSize: '0.7rem',
            fontWeight: '700',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          ⌫
        </button>
      </div>

      {error && <p className="error-msg" style={{ marginBottom: '0.4rem' }}>{error}</p>}
      <button className="btn-primary" onClick={submit} disabled={disabled || digits.some(d => d === '')}>
        FIRE GUESS 🎯
      </button>
    </div>
  );
}

// ── Main GameScreen ────────────────────────────────────────────────────────
export default function GameScreen({
  numDigits, allowDuplicates = true, playerName, opponentName,
  myGuesses, oppGuesses,
  isMyTurn, onGuess, onTimeout, oppDisconnected,
}) {
  const myListRef = useRef(null);
  const oppListRef = useRef(null);

  useEffect(() => {
    myListRef.current?.scrollTo({ top: myListRef.current.scrollHeight, behavior: 'smooth' });
  }, [myGuesses]);
  useEffect(() => {
    oppListRef.current?.scrollTo({ top: oppListRef.current.scrollHeight, behavior: 'smooth' });
  }, [oppGuesses]);

  const turnLabel = oppDisconnected
    ? '⚠ Opponent disconnected'
    : isMyTurn
      ? '🎯 Your Turn — Make a guess!'
      : `⏳ ${opponentName} is thinking…`;

  return (
    <div className="screen fade-in" style={{ justifyContent: 'flex-start', paddingTop: '4.5rem', paddingBottom: '5.5rem', gap: '1rem' }}>

      {/* Turn badge */}
      <div style={{ textAlign: 'center', width: '100%', maxWidth: '780px' }}>
        <span className={`turn-badge ${isMyTurn && !oppDisconnected ? 'my-turn' : 'their-turn'}`}>
          {turnLabel}
        </span>

        {/* Timer bar */}
        <div style={{ maxWidth: '300px', margin: '0 auto' }}>
          <TurnTimer isMyTurn={isMyTurn && !oppDisconnected} onTimeout={onTimeout} seconds={60} />
        </div>

        {/* Match rules & Bulls/Cows quick reference */}
        <div style={{
          display: 'inline-flex',
          gap: '0.85rem',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '0.5rem',
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '0.35rem 0.95rem',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          fontSize: '0.72rem',
          flexWrap: 'wrap',
        }}>
          <span style={{ color: allowDuplicates ? 'var(--accent)' : 'var(--gold)', fontWeight: '700', letterSpacing: '0.08em' }}>
            {allowDuplicates ? '⚡ REPEATS ALLOWED' : '🔒 UNIQUE DIGITS'}
          </span>
          <span style={{ color: 'var(--text-dim)' }}>|</span>
          <span style={{ color: 'var(--text-muted)' }}>
            🐂 <strong style={{ color: 'var(--accent)' }}>Bulls</strong>: right spot &amp; digit
          </span>
          <span style={{ color: 'var(--text-dim)' }}>|</span>
          <span style={{ color: 'var(--text-muted)' }}>
            🐄 <strong style={{ color: 'var(--gold)' }}>Cows</strong>: digit only
          </span>
        </div>
      </div>

      {/* Panels */}
      <div style={{
        display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
        justifyContent: 'center', width: '100%', maxWidth: '800px',
        flex: 1,
      }}>

        {/* ── MY GUESSES ── */}
        <TiltCard style={{ flex: 1, minWidth: '280px', maxWidth: '370px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">🎯 Your Guesses</div>

          {/* Digit scratchpad */}
          {myGuesses.length > 0 && <DigitScratchpad myGuesses={myGuesses} />}

          {/* Input (only on your turn) */}
          {isMyTurn && !oppDisconnected && (
            <GuessInput numDigits={numDigits} allowDuplicates={allowDuplicates} onGuess={onGuess} />
          )}

          {/* Opponent thinking indicator */}
          {!isMyTurn && !oppDisconnected && (
            <div className="pulse" style={{
              padding: '0.75rem',
              background: 'var(--input-bg)',
              border: '1px solid rgba(0, 255, 204, 0.2)',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.8rem',
              color: 'var(--accent)',
              textAlign: 'center',
              letterSpacing: '0.1em',
              fontWeight: '600',
            }}>
              ⚡ {opponentName} is analyzing clues…
            </div>
          )}

          {/* Guess history */}
          <div ref={myListRef} style={{ flex: 1, overflowY: 'auto', maxHeight: '280px' }}>
            {myGuesses.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center', padding: '1.2rem' }}>
                No guesses yet
              </p>
            ) : (
              [...myGuesses].reverse().map((g, i) => (
                <GuessRow key={i} entry={g} numDigits={numDigits} />
              ))
            )}
          </div>

          {myGuesses.length > 0 && (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textAlign: 'center', marginTop: '0.5rem' }}>
              {myGuesses.length} round{myGuesses.length !== 1 ? 's' : ''} fired
            </p>
          )}
        </TiltCard>

        {/* ── OPPONENT'S GUESSES ── */}
        <TiltCard style={{ flex: 1, minWidth: '280px', maxWidth: '370px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">👁 {opponentName}'s Guesses</div>

          {/* Digit scratchpad for opponent */}
          {oppGuesses.length > 0 && <DigitScratchpad myGuesses={oppGuesses} />}

          <div ref={oppListRef} style={{ flex: 1, overflowY: 'auto', maxHeight: '340px' }}>
            {oppGuesses.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center', padding: '1.2rem' }}>
                Waiting for {opponentName} to make a move…
              </p>
            ) : (
              [...oppGuesses].reverse().map((g, i) => (
                <GuessRow key={i} entry={g} numDigits={numDigits} />
              ))
            )}
          </div>

          {oppGuesses.length > 0 && (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textAlign: 'center', marginTop: '0.5rem' }}>
              {oppGuesses.length} round{oppGuesses.length !== 1 ? 's' : ''} fired
            </p>
          )}
        </TiltCard>
      </div>
    </div>
  );
}

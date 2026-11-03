import { useState } from 'react';
import TiltCard from './TiltCard';
import CuteWaitingToy from './CuteWaitingToy';
import ReflexGame from './ReflexGame';
import { sounds } from '../utils/audio';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    sounds.playClick();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        background: copied ? 'rgba(0,255,204,0.18)' : 'var(--input-bg)',
        border: `1px solid ${copied ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '8px',
        color: copied ? 'var(--accent)' : 'var(--text)',
        padding: '0.65rem 1.1rem',
        fontSize: '0.78rem',
        fontWeight: '700',
        letterSpacing: '0.14em',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: copied ? '0 0 15px rgba(0,255,204,0.3)' : 'none',
      }}
    >
      {copied ? '✓ COPIED!' : '📋 COPY CODE'}
    </button>
  );
}

function WhatsAppButton({ roomCode, numDigits }) {
  const message = encodeURIComponent(
    `Hey! Join my SAI & KANNA digit guessing game 🎮\nRoom Code: ${roomCode}\n(${numDigits}-digit game)\nOpen the game and enter the code to join!`
  );
  const url = `https://api.whatsapp.com/send?text=${message}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => sounds.playClick()}
      style={{
        background: '#25D366',
        border: 'none',
        borderRadius: '8px',
        color: '#fff',
        padding: '0.65rem 1.1rem',
        fontSize: '0.78rem',
        fontWeight: '700',
        letterSpacing: '0.12em',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 0 15px rgba(37, 211, 102, 0.4)',
        transition: 'transform 0.15s',
      }}
    >
      📱 SHARE TO WHATSAPP
    </a>
  );
}

export default function WaitingScreen({ roomCode, isHost, opponentName, numDigits, allowDuplicates = true }) {
  const [waitingActivity, setWaitingActivity] = useState('popper');
  const opponentJoined = Boolean(opponentName);

  return (
    <div className="screen fade-in">
      <div style={{ textAlign: 'center', maxWidth: '440px', width: '100%' }}>

        {isHost ? (
          <>
            <h2 className="welcome-title" style={{ marginBottom: '0.6rem' }}>
              {opponentJoined ? '✓ OPPONENT JOINED!' : 'ROOM READY'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', letterSpacing: '0.1em', marginBottom: '2rem' }}>
              {opponentJoined
                ? `${opponentName} has connected. Synchronizing setup…`
                : 'Share this tactical code with your opponent'}
            </p>

            {/* Room code card — 3D Tilt + Clickable */}
            <TiltCard
              className="clickable-code"
              style={{
                marginBottom: '1.25rem',
                cursor: 'pointer',
                border: opponentJoined ? '1px solid var(--accent)' : '1px solid var(--card-border)',
                boxShadow: opponentJoined ? '0 0 30px rgba(0,255,204,0.3)' : undefined,
              }}
            >
              <div
                onClick={() => {
                  sounds.playClick();
                  navigator.clipboard.writeText(roomCode);
                }}
                title="Click to copy"
              >
                <p className="section-label">ACCESS CODE</p>
                <p style={{
                  fontFamily: 'Anton, sans-serif',
                  fontSize: '3.4rem',
                  letterSpacing: '0.35em',
                  color: 'var(--accent)',
                  lineHeight: 1,
                  textShadow: '0 0 25px rgba(0, 255, 204, 0.65)',
                }}>
                  {roomCode}
                </p>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: '0.55rem', letterSpacing: '0.1em' }}>
                  {numDigits}-DIGIT MATCH · {allowDuplicates ? '⚡ DUPLICATES ALLOWED' : '🔒 UNIQUE DIGITS ONLY'}
                </p>
              </div>
            </TiltCard>

            {/* Share buttons */}
            {!opponentJoined && (
              <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
                <CopyButton text={roomCode} />
                <WhatsAppButton roomCode={roomCode} numDigits={numDigits} />
              </div>
            )}

            {!opponentJoined ? (
              <>
                <p className="pulse" style={{ color: 'var(--text-dim)', fontSize: '0.82rem', letterSpacing: '0.12em', marginBottom: '0.6rem' }}>
                  📡 WAITING FOR OPPONENT TO CONNECT…
                </p>

                {/* Minigame selector pill */}
                <div style={{ display: 'inline-flex', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '2px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => { sounds.playHover(); setWaitingActivity('popper'); }}
                    style={{
                      background: waitingActivity === 'popper' ? 'var(--accent)' : 'transparent',
                      color: waitingActivity === 'popper' ? '#000' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '3px 10px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    🫧 POPPER
                  </button>
                  <button
                    type="button"
                    onClick={() => { sounds.playHover(); setWaitingActivity('reflex'); }}
                    style={{
                      background: waitingActivity === 'reflex' ? 'var(--accent)' : 'transparent',
                      color: waitingActivity === 'reflex' ? '#000' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '3px 10px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ REFLEX TEST
                  </button>
                </div>

                {waitingActivity === 'popper' ? (
                  <CuteWaitingToy title="WAITING ZONE: RELAX &amp; POP" />
                ) : (
                  <ReflexGame />
                )}
              </>
            ) : (
              <p style={{ color: 'var(--accent)', fontSize: '0.85rem', letterSpacing: '0.12em', fontWeight: '700' }}>
                ⚡ STARTING GAME SETUP…
              </p>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }} className="pulse">⏳</div>
            <h2 className="welcome-title" style={{ marginBottom: '0.5rem' }}>LINKING…</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
              Connected to room{' '}
              <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{roomCode}</span>. Initializing…
            </p>
          </>
        )}
      </div>
    </div>
  );
}

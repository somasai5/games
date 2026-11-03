import { useState } from 'react';
import Confetti from './Confetti';
import TiltCard from './TiltCard';
import { sounds } from '../utils/audio';

export default function ResultScreen({
  won, winnerName, playerName, opponentName,
  mySecret, opponentSecret,
  myGuessCount, oppGuessCount,
  onPlayAgain, onNewGame,
  theme = 'cyber',
  scores,
}) {
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShare = () => {
    sounds.playClick();
    const shareText = `🎮 SAI & KANNA NUMBERS MATCH\n` +
      `👑 Winner: ${winnerName}\n` +
      `🎯 Rounds: ${won ? myGuessCount : oppGuessCount}\n` +
      (scores ? `⚔️ Rivalry Record: ${scores.hostWins || 0} - ${scores.guestWins || 0}\n` : '') +
      `🔥 Challenge me at: https://sai-kanna-game.onrender.com/`;

    navigator.clipboard.writeText(shareText).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    });
  };
  const getGrade = () => {
    if (!won) return { grade: 'FAILED', title: 'CODE COMPROMISED', color: 'var(--error)' };
    if (myGuessCount <= 3) return { grade: 'RANK S+', title: 'CYBER PRODIGY', color: 'var(--accent)' };
    if (myGuessCount <= 6) return { grade: 'RANK A', title: 'MASTER DECODER', color: 'var(--gold)' };
    return { grade: 'RANK B', title: 'SURVIVOR', color: 'var(--text)' };
  };

  const gradeInfo = getGrade();

  return (
    <div className="screen fade-in" style={{ position: 'relative', zIndex: 1 }}>
      {won && <Confetti theme={theme} />}

      <div style={{ textAlign: 'center', maxWidth: '480px', width: '100%' }}>

        {/* Trophy / Skull with animated glow bounce */}
        <div
          className={won ? 'bounce-glow' : 'shake-loss'}
          style={{ fontSize: '4.8rem', marginBottom: '0.8rem', userSelect: 'none' }}
        >
          {won ? '🏆' : '💀'}
        </div>

        {/* Grade Badge */}
        <div style={{
          display: 'inline-block',
          background: 'rgba(0,0,0,0.5)',
          border: `1px solid ${gradeInfo.color}`,
          boxShadow: `0 0 16px ${gradeInfo.color}`,
          borderRadius: '20px',
          padding: '0.35rem 1.1rem',
          fontSize: '0.78rem',
          fontWeight: '800',
          letterSpacing: '0.16em',
          color: gradeInfo.color,
          marginBottom: '0.75rem',
        }}>
          {gradeInfo.grade} • {gradeInfo.title}
        </div>

        <h2
          className={`welcome-title ${won ? 'glow-win-text' : 'glow-loss-text'}`}
          style={{
            color: won ? 'var(--accent)' : 'var(--error)',
            marginBottom: '0.5rem',
            fontSize: 'clamp(2.4rem, 6vw, 3.8rem)',
            letterSpacing: '0.08em',
          }}
        >
          {won ? 'VICTORY ACHIEVED!' : 'MISSION FAILED'}
        </h2>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          letterSpacing: '0.08em',
          marginBottom: '2rem',
        }}>
          {won
            ? `Decrypted target code in ${myGuessCount} round${myGuessCount !== 1 ? 's' : ''}! 🎯`
            : `${winnerName} decoded your secret first in ${oppGuessCount} rounds.`}
        </p>

        {/* Secrets reveal card with 3D Tilt */}
        <TiltCard style={{ marginBottom: '1.75rem', border: won ? '1px solid var(--accent)' : '1px solid var(--error)' }}>
          <p className="section-label" style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            DECRYPTED SECRETS
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', alignItems: 'center' }}>

            <div style={{ textAlign: 'center', flex: 1 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: '0.15em', marginBottom: '0.4rem' }}>
                YOUR SECRET
              </p>
              <p style={{
                fontFamily: 'Anton, sans-serif',
                fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
                letterSpacing: '0.25em',
                color: won ? 'var(--accent)' : 'var(--text)',
                textShadow: won ? '0 0 16px var(--accent-glow)' : 'none',
              }}>
                {mySecret}
              </p>
            </div>

            <div style={{ width: '1px', background: 'var(--border)', height: '60px' }} />

            <div style={{ textAlign: 'center', flex: 1 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: '0.15em', marginBottom: '0.4rem' }}>
                {opponentName}'s SECRET
              </p>
              <p style={{
                fontFamily: 'Anton, sans-serif',
                fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
                letterSpacing: '0.25em',
                color: won ? 'var(--text)' : 'var(--error)',
                textShadow: !won ? '0 0 16px rgba(255,71,87,0.7)' : 'none',
              }}>
                {opponentSecret}
              </p>
            </div>
          </div>
        </TiltCard>

        {/* Share match card button */}
        <button
          type="button"
          onClick={handleShare}
          style={{
            width: '100%',
            background: copiedShare ? 'rgba(0,255,204,0.2)' : 'var(--input-bg)',
            border: `1px solid ${copiedShare ? 'var(--accent)' : 'var(--border)'}`,
            color: copiedShare ? 'var(--accent)' : 'var(--text)',
            borderRadius: '10px',
            padding: '0.65rem',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            marginBottom: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: copiedShare ? '0 0 15px var(--accent-glow)' : 'none',
          }}
        >
          {copiedShare ? '✓ MATCH STATS COPIED TO CLIPBOARD!' : '📋 COPY MATCH CARD (SHARE TO WHATSAPP / DISCORD)'}
        </button>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className="btn-primary"
            onClick={() => {
              sounds.playLockIn();
              onPlayAgain();
            }}
            style={{ flex: 1 }}
          >
            PLAY AGAIN ↺
          </button>
          <button
            className="btn-outline"
            onClick={() => {
              sounds.playClick();
              onNewGame();
            }}
            style={{ flex: 1 }}
          >
            LOBBY MENU →
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { sounds } from '../utils/audio';

const CUTE_AFFIRMATIONS = [
  'Sending you a pocket full of warm teddy cuddles! 🧸💖',
  'You are the smartest, cutest gamer in the galaxy! ✨',
  'Every second waiting is worth it when playing with someone as sweet as you 💕',
  'Take a deep breath and smile — you are doing wonderful! 🌸',
  'Loading maximum sweetness... 100% complete! 🍓',
  'Did you know? Thinking of you makes everything 10x cuter! 🎀',
  'No matter the score, you\'re always the champion of hearts! 👑💖',
  'A little reminder: you are truly special and loved! 💌'
];

const BUBBLE_ICONS = ['🧸', '💖', '✨', '🌸', '🍓', '🎀', '🐱', '🍬', '🐰', '💕', '🌷', '⭐️'];

export default function CuteWaitingToy({ title = 'WAITING ZONE: RELAX & POP' }) {
  const [poppedIndices, setPoppedIndices] = useState(new Set());
  const [popCount, setPopCount] = useState(0);
  const [noteIndex, setNoteIndex] = useState(0);

  const handlePop = (index) => {
    if (poppedIndices.has(index)) return;

    sounds.playPop();
    const nextSet = new Set(poppedIndices);
    nextSet.add(index);
    setPoppedIndices(nextSet);
    setPopCount(prev => prev + 1);

    // If all are popped, celebrate and refill!
    if (nextSet.size === BUBBLE_ICONS.length) {
      setTimeout(() => {
        sounds.playSparkle();
        setPoppedIndices(new Set());
      }, 400);
    }
  };

  const nextAffirmation = () => {
    sounds.playHeart();
    setNoteIndex(prev => (prev + 1) % CUTE_AFFIRMATIONS.length);
  };

  return (
    <div className="cute-waiting-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ fontSize: '0.78rem', letterSpacing: '0.12em', color: 'var(--accent)', fontWeight: 700 }}>
          {title}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          POPS: <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{popCount}</span> 🫧
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.6rem' }}>
        Pop these cute bubbles while waiting! (Auto-refills when cleared)
      </div>

      <div className="cute-bubble-grid">
        {BUBBLE_ICONS.map((icon, idx) => {
          const isPopped = poppedIndices.has(idx);
          return (
            <button
              key={idx}
              type="button"
              className={`cute-bubble ${isPopped ? 'popped' : ''}`}
              onClick={() => handlePop(idx)}
              aria-label={`Pop bubble ${idx + 1}`}
            >
              {isPopped ? '🫧' : icon}
            </button>
          );
        })}
      </div>

      {/* Cute note card */}
      <div
        className="cute-affirmation-box"
        onClick={nextAffirmation}
        title="Click for another sweet note!"
      >
        <span style={{ fontSize: '1rem' }}>💌</span>
        <span style={{ flex: 1, fontStyle: 'italic', textAlign: 'left', lineHeight: 1.4 }}>
          "{CUTE_AFFIRMATIONS[noteIndex]}"
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--accent)', whiteSpace: 'nowrap' }}>
          Tap ↻
        </span>
      </div>
    </div>
  );
}

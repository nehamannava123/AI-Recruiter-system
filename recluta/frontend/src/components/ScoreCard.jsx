import { useEffect, useState } from 'react';

export default function ScoreCard({ icon: Icon, title, score, feedback, delay = 0 }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, delay);
    return () => clearTimeout(timer);
  }, [score, delay]);

  return (
    <div className="card flex items-start gap-4 p-5 transition-all duration-200 hover:border-cobalt/40">
      <div className="relative flex-shrink-0">
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="6"
          />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="var(--accent-aurora)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 44 44)"
            style={{
              transition: 'stroke-dashoffset 1s ease-out',
            }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-bold text-aurora">
          {Math.round(animatedScore)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="mb-1 flex items-center gap-2">
          {Icon && <Icon size={16} className="text-cobalt" />}
          <h3 className="font-display text-sm font-semibold text-primary">{title}</h3>
        </div>
        <p className="text-xs text-secondary leading-relaxed">{feedback}</p>
      </div>
    </div>
  );
}

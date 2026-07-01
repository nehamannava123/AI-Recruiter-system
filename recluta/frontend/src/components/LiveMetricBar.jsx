export default function LiveMetricBar({ label, value, max = 100, unit = '', color = 'aurora' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colorClass = color === 'warn' ? 'bg-warn' : color === 'cobalt' ? 'bg-cobalt' : 'bg-aurora';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-secondary">{label}</span>
        <span className={`metric-value font-mono text-sm text-${color === 'warn' ? 'warn' : 'aurora'}`}>
          {Math.round(value)}{unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-pill bg-elevated">
        <div
          className={`h-full rounded-pill ${colorClass} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function WpmGauge({ wpm = 0 }) {
  const optimal = 140;
  const pct = Math.min(100, (wpm / 200) * 100);
  const radius = 40;
  const circumference = Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const isOptimal = wpm >= 120 && wpm <= 160;

  return (
    <div className="card p-4">
      <p className="mb-3 text-xs text-secondary">Words Per Minute</p>
      <div className="relative mx-auto" style={{ width: 100, height: 60 }}>
        <svg width="100" height="60" viewBox="0 0 100 60">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="var(--border)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={isOptimal ? 'var(--accent-aurora)' : 'var(--accent-cobalt)'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 300ms ease' }}
          />
        </svg>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 font-display text-2xl font-bold text-aurora metric-value">
          {wpm}
        </span>
      </div>
      <p className="mt-2 text-center text-xs text-muted">Target: {optimal} WPM</p>
    </div>
  );
}

export function EyeContactRing({ percentage = 0 }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="card p-4">
      <p className="mb-3 text-xs text-secondary">Eye Contact</p>
      <div className="relative mx-auto" style={{ width: 80, height: 80 }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="var(--accent-aurora)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dashoffset 300ms ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-sm text-aurora metric-value">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

export function FillerCounter({ count = 0 }) {
  return (
    <div className="card p-4">
      <p className="mb-2 text-xs text-secondary">Filler Words</p>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold text-warn metric-value">{count}</span>
        <span className="text-xs text-muted">detected</span>
      </div>
      {count > 5 && (
        <p className="mt-2 text-xs text-warn">Try pausing instead of using fillers</p>
      )}
    </div>
  );
}

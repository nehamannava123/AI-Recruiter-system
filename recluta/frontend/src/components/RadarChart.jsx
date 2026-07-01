import { motion } from 'framer-motion';

const AXES = [
  { key: 'confidence', label: 'Confidence' },
  { key: 'eyeContact', label: 'Eye Contact' },
  { key: 'pace', label: 'Pace' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'answerQuality', label: 'Answer Quality' },
];

const DEFAULT_SCORES = {
  confidence: 0,
  eyeContact: 0,
  pace: 0,
  clarity: 0,
  engagement: 0,
  answerQuality: 0,
};

function polarToCartesian(cx, cy, radius, angleIndex, total) {
  const angle = (Math.PI * 2 * angleIndex) / total - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function getPolygonPoints(scores, cx, cy, maxRadius, total, maxValue = 100) {
  return AXES.slice(0, total)
    .map((axis, i) => {
      const value = scores[axis.key] ?? 0;
      const r = (value / maxValue) * maxRadius;
      const point = polarToCartesian(cx, cy, r, i, total);
      return `${point.x},${point.y}`;
    })
    .join(' ');
}

export default function RadarChart({
  scores = DEFAULT_SCORES,
  size = 320,
  live = false,
  mini = false,
  animate = true,
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.35;
  const axisCount = mini ? 4 : 6;
  const displayAxes = AXES.slice(0, axisCount);
  const displayScores = { ...DEFAULT_SCORES, ...scores };

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className={`relative ${live ? 'radar-live' : ''}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gridLevels.map((level) => {
          const points = displayAxes
            .map((_, i) => {
              const p = polarToCartesian(cx, cy, maxRadius * level, i, axisCount);
              return `${p.x},${p.y}`;
            })
            .join(' ');
          return (
            <polygon
              key={level}
              points={points}
              fill="none"
              stroke="var(--border)"
              strokeWidth="1"
            />
          );
        })}

        {displayAxes.map((_, i) => {
          const end = polarToCartesian(cx, cy, maxRadius, i, axisCount);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="var(--border)"
              strokeWidth="1"
            />
          );
        })}

        {animate ? (
          <motion.polygon
            points={getPolygonPoints(displayScores, cx, cy, maxRadius, axisCount)}
            fill="rgba(0, 255, 163, 0.3)"
            stroke="var(--accent-aurora)"
            strokeWidth="2"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        ) : (
          <polygon
            points={getPolygonPoints(displayScores, cx, cy, maxRadius, axisCount)}
            fill="rgba(0, 255, 163, 0.3)"
            stroke="var(--accent-aurora)"
            strokeWidth="2"
          />
        )}

        {displayAxes.map((axis, i) => {
          const labelPoint = polarToCartesian(cx, cy, maxRadius + 22, i, axisCount);
          return (
            <text
              key={axis.key}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--text-secondary)"
              fontSize={mini ? 8 : 10}
              fontFamily="JetBrains Mono, monospace"
            >
              {mini ? axis.label.split(' ')[0] : axis.label}
            </text>
          );
        })}

        {live && (
          <circle cx={cx} cy={cy} r="4" fill="var(--accent-aurora)" className="animate-pulseLive" />
        )}
      </svg>
    </div>
  );
}

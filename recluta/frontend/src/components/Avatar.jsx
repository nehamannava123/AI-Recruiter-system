export default function Avatar({ isSpeaking = false, size = 200 }) {
  const radius = size / 2;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size + 40, height: size + 40 }}
    >
      <div
        className={`absolute rounded-full transition-all duration-200 ${
          isSpeaking ? 'animate-pulseLive' : 'opacity-30'
        }`}
        style={{
          width: size + 30,
          height: size + 30,
          border: `2px solid var(--accent-aurora)`,
          boxShadow: isSpeaking
            ? '0 0 30px rgba(0, 255, 163, 0.4)'
            : 'none',
        }}
      />

      <div
        className="relative flex items-center justify-center rounded-full border-2 border-border bg-card"
        style={{ width: size, height: size }}
      >
        <div className="absolute flex gap-8" style={{ top: radius * 0.55 }}>
          <div
            className="rounded-full bg-primary animate-blink"
            style={{ width: 10, height: 10 }}
          />
          <div
            className="rounded-full bg-primary animate-blink"
            style={{ width: 10, height: 10 }}
          />
        </div>

        <svg
          width={size * 0.5}
          height={size * 0.2}
          viewBox="0 0 60 24"
          className="absolute"
          style={{ bottom: radius * 0.35 }}
        >
          {isSpeaking ? (
            <ellipse
              cx="30"
              cy="12"
              rx="14"
              ry="10"
              fill="var(--accent-aurora)"
              className="transition-all duration-200"
            >
              <animate
                attributeName="ry"
                values="8;12;8"
                dur="0.3s"
                repeatCount="indefinite"
              />
            </ellipse>
          ) : (
            <path
              d="M 12 12 Q 30 18 48 12"
              fill="none"
              stroke="var(--text-secondary)"
              strokeWidth="2"
              strokeLinecap="round"
              className="transition-all duration-200"
            />
          )}
        </svg>
      </div>

      {isSpeaking && (
        <div className="absolute -bottom-2 flex items-center gap-2">
          <span className="live-dot" />
          <span className="font-mono text-xs text-aurora">Speaking...</span>
        </div>
      )}
    </div>
  );
}

function MissingSkillsPie({ missing, matched }) {
  missing = Number(missing ?? 0);
  matched = Number(matched ?? 0);

  const total = (missing || 0) + (matched || 0);
  if (!total) {
    return <div style={{ color: "#64748b", fontStyle: "italic" }}>No skills data yet.</div>;
  }

  const matchedSlice = (matched || 0) / total;

  const size = 170;
  const r = 65;
  const cx = size / 2;
  const cy = size / 2;

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [`M ${cx} ${cy}`, `L ${start.x} ${start.y}`, `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, "Z"].join(
      " "
    );
  };

  const matchedStart = 0;
  const matchedEnd = matchedSlice * 360;
  const missingStart = matchedEnd;
  const missingEnd = 360;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center", boxSizing: "border-box" }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
          <circle cx={cx} cy={cy} r={r} fill="#f1f5f9" />
          <path d={describeArc(matchedStart, matchedEnd)} fill="#f59e0b" />
          <path d={describeArc(missingStart, missingEnd)} fill="#ef4444" />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 900, color: "#0f172a", fontSize: "20px" }}>
            {Math.round(((matched || 0) / total) * 100)}%
          </div>
          <div style={{ color: "#475569", fontSize: "12px", fontWeight: 700 }}>Match Fit</div>
        </div>
      </div>

      <div style={{ flex: "1 1 160px", minWidth: "160px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: "#f59e0b", flexShrink: 0 }} />
            <span style={{ fontWeight: 800, color: "#0f172a" }}>Matched Skills</span>
            <span style={{ marginLeft: "auto", fontWeight: 900, color: "#92400e" }}>{matched}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: "#ef4444", flexShrink: 0 }} />
            <span style={{ fontWeight: 800, color: "#0f172a" }}>Missing Skills</span>
            <span style={{ marginLeft: "auto", fontWeight: 900, color: "#991b1b" }}>{missing}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MissingSkillsPie;

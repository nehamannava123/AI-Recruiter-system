import { useState } from "react";

/* ---------------------------------------------------------------------- */
/* Design tokens                                                          */
/* ---------------------------------------------------------------------- */
const C = {
  bg: "#0B1220",
  bgGrid: "rgba(255,255,255,0.035)",
  panel: "#121B2E",
  panelAlt: "#0F1729",
  border: "#243047",
  borderSoft: "#1B2638",
  text: "#E7ECF6",
  textMuted: "#8A96AC",
  textFaint: "#5B6680",
  amber: "#F2B807",
  amberSoft: "rgba(242,184,7,0.12)",
  teal: "#2DD4BF",
  tealSoft: "rgba(45,212,191,0.12)",
  coral: "#FB7185",
  coralSoft: "rgba(251,113,133,0.12)",
};

const fontDisplay = "'Space Grotesk', 'Segoe UI', sans-serif";
const fontBody = "'IBM Plex Sans', 'Segoe UI', sans-serif";
const fontMono = "'IBM Plex Mono', 'SFMono-Regular', Menlo, monospace";

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

    .ar-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
    .ar-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .ar-scrollbar::-webkit-scrollbar-thumb { background: ${C.borderSoft}; border-radius: 8px; }

    @keyframes ar-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
    @keyframes ar-fade-up {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .ar-fade-up { animation: ar-fade-up 0.5s ease both; }

    .ar-chip { transition: border-color 0.15s ease, transform 0.15s ease; }
    .ar-chip:hover { transform: translateY(-1px); }

    .ar-btn { transition: filter 0.15s ease, transform 0.1s ease; }
    .ar-btn:not(:disabled):hover { filter: brightness(1.08); }
    .ar-btn:not(:disabled):active { transform: scale(0.98); }

    .ar-input:focus { outline: none; border-color: ${C.amber} !important; box-shadow: 0 0 0 3px ${C.amberSoft}; }

    @media (prefers-reduced-motion: reduce) {
      .ar-fade-up, .ar-pulse-dot { animation: none !important; }
    }
  `}</style>
);

/* ---------------------------------------------------------------------- */
/* Small building blocks                                                  */
/* ---------------------------------------------------------------------- */

function Eyebrow({ children }) {
  return (
    <div
      style={{
        fontFamily: fontMono,
        fontSize: "11px",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: C.textFaint,
        marginBottom: "6px",
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

function Panel({ index, label, children, accent = C.amber }) {
  return (
    <div
      className="ar-fade-up"
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 20px 40px -24px rgba(0,0,0,0.6)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 22px",
          borderBottom: `1px solid ${C.borderSoft}`,
          background: C.panelAlt,
        }}
      >
        <span
          style={{
            fontFamily: fontMono,
            fontSize: "11px",
            fontWeight: 600,
            color: accent,
            border: `1px solid ${accent}`,
            borderRadius: "4px",
            padding: "2px 6px",
            letterSpacing: "0.05em",
          }}
        >
          {index}
        </span>
        <span
          style={{
            fontFamily: fontMono,
            fontSize: "12px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: C.textMuted,
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label
      style={{
        display: "block",
        fontFamily: fontBody,
        fontSize: "13px",
        fontWeight: 600,
        color: C.text,
        marginBottom: "8px",
      }}
    >
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "8px",
  border: `1px solid ${C.border}`,
  background: C.panelAlt,
  color: C.text,
  fontFamily: fontBody,
  fontSize: "14px",
  boxSizing: "border-box",
};

/* Pipeline stepper — reflects the real stages a resume passes through */
function PipelineStepper({ stage }) {
  const steps = [
    { n: "01", label: "Role & JD" },
    { n: "02", label: "Upload" },
    { n: "03", label: "Scan" },
    { n: "04", label: "Rank" },
  ];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0px",
        marginBottom: "30px",
        flexWrap: "wrap",
      }}
    >
      {steps.map((s, i) => {
        const reached = i <= stage;
        const active = i === stage;
        return (
          <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 12px 7px 8px",
                borderRadius: "999px",
                border: `1px solid ${reached ? C.amber : C.border}`,
                background: reached ? C.amberSoft : "transparent",
              }}
            >
              <span
                className="ar-pulse-dot"
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: reached ? C.amber : C.textFaint,
                  animation: active ? "ar-pulse 1.4s ease-in-out infinite" : "none",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: fontMono,
                  fontSize: "11px",
                  color: reached ? C.amber : C.textFaint,
                  fontWeight: 600,
                }}
              >
                {s.n}
              </span>
              <span
                style={{
                  fontFamily: fontBody,
                  fontSize: "12.5px",
                  color: reached ? C.text : C.textFaint,
                  fontWeight: 500,
                }}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  width: "20px",
                  height: "1px",
                  background: i < stage ? C.amber : C.border,
                  margin: "0 4px",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Donut chart                                                            */
/* ---------------------------------------------------------------------- */
function MissingSkillsPie({ missing, matched }) {
  missing = Number(missing ?? 0);
  matched = Number(matched ?? 0);

  const total = missing + matched;
  if (!total) {
    return (
      <div style={{ color: C.textFaint, fontFamily: fontMono, fontSize: "13px" }}>
        No skills data yet.
      </div>
    );
  }

  const matchedSlice = matched / total;
  const size = 168;
  const r = 64;
  const stroke = 18;
  const circumference = 2 * Math.PI * r;
  const matchedLen = circumference * matchedSlice;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "168px 1fr",
        gap: "24px",
        alignItems: "center",
      }}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.borderSoft} strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={C.coral}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={0}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={C.amber}
            strokeWidth={stroke}
            strokeDasharray={`${matchedLen} ${circumference - matchedLen}`}
            strokeDashoffset={0}
            strokeLinecap="butt"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontFamily: fontMono, fontWeight: 700, color: C.text, fontSize: "24px" }}>
            {Math.round(matchedSlice * 100)}%
          </div>
          <div
            style={{
              fontFamily: fontMono,
              color: C.textFaint,
              fontSize: "10px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginTop: "2px",
            }}
          >
            Match fit
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: C.amber, flexShrink: 0 }} />
          <span style={{ fontFamily: fontBody, fontWeight: 600, color: C.text, fontSize: "13.5px" }}>
            Matched Skills
          </span>
          <span style={{ marginLeft: "auto", fontFamily: fontMono, fontWeight: 700, color: C.amber, fontSize: "14px" }}>
            {matched}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: C.coral, flexShrink: 0 }} />
          <span style={{ fontFamily: fontBody, fontWeight: 600, color: C.text, fontSize: "13.5px" }}>
            Missing Skills
          </span>
          <span style={{ marginLeft: "auto", fontFamily: fontMono, fontWeight: 700, color: C.coral, fontSize: "14px" }}>
            {missing}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Skill chips                                                            */
/* ---------------------------------------------------------------------- */
function SkillList({ skills, tone = "neutral" }) {
  const palette = {
    neutral: { fg: C.text, border: C.border, bg: "transparent" },
    matched: { fg: C.amber, border: "rgba(242,184,7,0.4)", bg: C.amberSoft },
    missing: { fg: C.coral, border: "rgba(251,113,133,0.4)", bg: C.coralSoft },
  }[tone];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {(skills || []).map((s) => (
        <span
          key={s}
          className="ar-chip"
          style={{
            background: palette.bg,
            color: palette.fg,
            border: `1px solid ${palette.border}`,
            padding: "5px 12px",
            borderRadius: "999px",
            fontSize: "12.5px",
            fontFamily: fontMono,
            fontWeight: 500,
          }}
        >
          {s}
        </span>
      ))}
      {(!skills || skills.length === 0) && (
        <span style={{ color: C.textFaint, fontFamily: fontMono, fontSize: "12.5px", fontStyle: "italic" }}>
          None found
        </span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Main dashboard                                                         */
/* ---------------------------------------------------------------------- */
function Dashboard() {
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [file, setFile] = useState(null);

  const [resumePreview, setResumePreview] = useState("");
  const [resumeSkillsFound, setResumeSkillsFound] = useState([]);

  const [candidates, setCandidates] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(false);

  const stage = analytics ? 3 : resumePreview ? 2 : file ? 1 : 0;

  const screenCandidate = async () => {
    try {
      if (!role || !jd) {
        alert("Please enter Job Role and Job Description");
        return;
      }
      if (!file) {
        alert("Please upload a resume");
        return;
      }

      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Resume Upload Failed");
      }

      const uploadData = await uploadResponse.json();
      setResumePreview(uploadData.resumePreview || "");
      setResumeSkillsFound(uploadData.resumeSkillsFound || []);

      const rankResponse = await fetch("http://127.0.0.1:8000/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, job_description: jd }),
      });

      const rankData = await rankResponse.json();

      const uniqueCandidates = [
        ...new Map((rankData.top_candidates || []).map((item) => [item.name, item])).values(),
      ];

      setCandidates(uniqueCandidates);
      setAnalytics(rankData.analytics || null);
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `
          radial-gradient(900px 500px at 15% -10%, rgba(242,184,7,0.08), transparent 60%),
          radial-gradient(700px 400px at 100% 0%, rgba(45,212,191,0.06), transparent 55%),
          ${C.bg}
        `,
        backgroundImage: `
          linear-gradient(${C.bgGrid} 1px, transparent 1px),
          linear-gradient(90deg, ${C.bgGrid} 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 36px 36px, 36px 36px",
        padding: "56px 24px 80px",
        fontFamily: fontBody,
      }}
    >
      <GlobalStyle />

      {/* Header */}
      <div style={{ maxWidth: "960px", margin: "0 auto 36px" }}>
        <Eyebrow>Applicant Tracking · Resume Intelligence</Eyebrow>
        <h1
          style={{
            fontFamily: fontDisplay,
            fontWeight: 700,
            fontSize: "clamp(28px, 4vw, 40px)",
            color: C.text,
            margin: 0,
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
          }}
        >
          AI Recruiter
        </h1>
        <p
          style={{
            fontFamily: fontBody,
            color: C.textMuted,
            fontSize: "15px",
            marginTop: "8px",
            maxWidth: "560px",
            lineHeight: 1.5,
          }}
        >
          Screen resumes against a role in seconds — skill matching, gap analysis, and ranked candidates in one pass.
        </p>
      </div>

      <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        <PipelineStepper stage={stage} />

        {/* Panel 1 — Input */}
        <Panel index="01" label="Role &amp; Job Description">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Job role</FieldLabel>
              <input
                type="text"
                placeholder="e.g. Senior Backend Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="ar-input"
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Job description</FieldLabel>
              <textarea
                rows="7"
                placeholder="Paste the full job description here…"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                className="ar-input"
                style={{ ...inputStyle, resize: "vertical", fontFamily: fontBody, lineHeight: 1.55 }}
              />
            </div>
          </div>

          <div style={{ marginTop: "22px", paddingTop: "20px", borderTop: `1px solid ${C.borderSoft}` }}>
            <FieldLabel>Resume (PDF)</FieldLabel>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
              <label
                className="ar-btn"
                style={{
                  cursor: "pointer",
                  border: `1px dashed ${C.border}`,
                  borderRadius: "8px",
                  padding: "10px 16px",
                  fontFamily: fontMono,
                  fontSize: "12.5px",
                  color: C.textMuted,
                  background: C.panelAlt,
                }}
              >
                Choose file
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  style={{ display: "none" }}
                />
              </label>
              {file ? (
                <span style={{ fontFamily: fontMono, fontSize: "12.5px", color: C.teal }}>
                  {file.name}
                </span>
              ) : (
                <span style={{ fontFamily: fontMono, fontSize: "12.5px", color: C.textFaint }}>
                  No file selected
                </span>
              )}
            </div>

            <button
              onClick={screenCandidate}
              disabled={loading}
              className="ar-btn"
              style={{
                marginTop: "22px",
                background: loading ? C.textFaint : C.amber,
                color: "#1A1300",
                border: "none",
                padding: "13px 24px",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: fontDisplay,
                fontWeight: 700,
                fontSize: "14px",
                width: "100%",
                letterSpacing: "0.01em",
              }}
            >
              {loading ? "Scanning resume…" : "Screen candidate"}
            </button>
          </div>
        </Panel>

        {/* Panel 2 — Resume preview */}
        {(resumePreview || resumeSkillsFound.length > 0) && (
          <Panel index="02" label="Resume Scan" accent={C.teal}>
            <div
              className="ar-scrollbar"
              style={{
                color: C.textMuted,
                background: C.panelAlt,
                border: `1px solid ${C.borderSoft}`,
                padding: "16px",
                borderRadius: "10px",
                whiteSpace: "pre-wrap",
                maxHeight: "220px",
                overflow: "auto",
                fontSize: "13px",
                fontFamily: fontMono,
                lineHeight: 1.6,
              }}
            >
              {resumePreview || ""}
            </div>

            <div style={{ marginTop: "20px" }}>
              <Eyebrow>Skills found in resume</Eyebrow>
              <SkillList skills={resumeSkillsFound} tone="matched" />
            </div>
          </Panel>
        )}

        {/* Panel 3 — Analytics */}
        {analytics && (
          <Panel index="03" label="Match Analytics" accent={C.amber}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <div style={{ padding: "16px", background: C.tealSoft, borderRadius: "10px", border: `1px solid rgba(45,212,191,0.25)` }}>
                <div style={{ fontFamily: fontMono, color: C.teal, fontWeight: 700, fontSize: "22px" }}>
                  {analytics.matchScore}%
                </div>
                <div style={{ color: C.textMuted, fontSize: "12px", fontFamily: fontBody, fontWeight: 600, marginTop: "2px" }}>
                  Match Score
                </div>
              </div>
              <div style={{ padding: "16px", background: C.amberSoft, borderRadius: "10px", border: `1px solid rgba(242,184,7,0.25)` }}>
                <div style={{ fontFamily: fontMono, color: C.amber, fontWeight: 700, fontSize: "22px" }}>
                  {analytics.matchedSkillsCount}
                </div>
                <div style={{ color: C.textMuted, fontSize: "12px", fontFamily: fontBody, fontWeight: 600, marginTop: "2px" }}>
                  Matched Skills
                </div>
              </div>
              <div style={{ padding: "16px", background: C.coralSoft, borderRadius: "10px", border: `1px solid rgba(251,113,133,0.25)` }}>
                <div style={{ fontFamily: fontMono, color: C.coral, fontWeight: 700, fontSize: "22px" }}>
                  {analytics.missingSkillsCount}
                </div>
                <div style={{ color: C.textMuted, fontSize: "12px", fontFamily: fontBody, fontWeight: 600, marginTop: "2px" }}>
                  Missing Skills
                </div>
              </div>
            </div>

            <div style={{ marginTop: "28px", paddingTop: "24px", borderTop: `1px solid ${C.borderSoft}` }}>
              <Eyebrow>Skill coverage breakdown</Eyebrow>
              <MissingSkillsPie
                missing={Number(analytics.missingSkillsCount || 0)}
                matched={Number(analytics.matchedSkillsCount || 0)}
              />

              <div style={{ marginTop: "24px" }}>
                <Eyebrow>Matched skills</Eyebrow>
                <SkillList skills={analytics.matchedSkills || []} tone="matched" />
              </div>

              <div style={{ marginTop: "18px" }}>
                <Eyebrow>Missing skills</Eyebrow>
                <SkillList skills={analytics.missingSkills || []} tone="missing" />
              </div>
            </div>
          </Panel>
        )}

        {/* Panel 4 — Candidates */}
        {candidates.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", margin: "10px 0 16px" }}>
              <span
                style={{
                  fontFamily: fontMono,
                  fontSize: "11px",
                  fontWeight: 600,
                  color: C.teal,
                  border: `1px solid ${C.teal}`,
                  borderRadius: "4px",
                  padding: "2px 6px",
                }}
              >
                04
              </span>
              <h2
                style={{
                  fontFamily: fontDisplay,
                  color: C.text,
                  fontSize: "20px",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Ranked Candidates
              </h2>
              <span style={{ fontFamily: fontMono, fontSize: "12px", color: C.textFaint }}>
                {candidates.length} result{candidates.length === 1 ? "" : "s"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {candidates.map((candidate) => (
                <div
                  key={candidate.name}
                  className="ar-fade-up"
                  style={{
                    background: C.panel,
                    border: `1px solid ${C.border}`,
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 20px 40px -28px rgba(0,0,0,0.6)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                    <h3 style={{ fontFamily: fontDisplay, color: C.text, fontSize: "18px", fontWeight: 700, margin: 0 }}>
                      {candidate.name}
                    </h3>
                    <span
                      style={{
                        fontFamily: fontMono,
                        fontWeight: 700,
                        fontSize: "16px",
                        color: C.amber,
                        background: C.amberSoft,
                        border: `1px solid rgba(242,184,7,0.3)`,
                        borderRadius: "999px",
                        padding: "4px 14px",
                      }}
                    >
                      {candidate.match_score}% match
                    </span>
                  </div>

                  <div style={{ marginTop: "16px" }}>
                    <Eyebrow>Required skills</Eyebrow>
                    <SkillList skills={candidate.requiredSkills} tone="neutral" />
                  </div>

                  <div style={{ marginTop: "16px" }}>
                    <Eyebrow>Matched skills</Eyebrow>
                    <SkillList skills={candidate.matchedSkills} tone="matched" />
                  </div>

                  <div style={{ marginTop: "16px" }}>
                    <Eyebrow>Missing skills</Eyebrow>
                    {candidate.missingSkills && candidate.missingSkills.length > 0 ? (
                      <SkillList skills={candidate.missingSkills} tone="missing" />
                    ) : (
                      <span style={{ color: C.teal, fontFamily: fontMono, fontSize: "12.5px", fontWeight: 600 }}>
                        Full coverage — no gaps
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

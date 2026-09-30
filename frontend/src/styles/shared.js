export const pageStyle = {
  minHeight: "100vh",
  background: "#0f172a",
  padding: "40px",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
};

export const cardStyle = {
  background: "white",
  width: "100%",
  maxWidth: "900px",
  margin: "auto",
  padding: "30px",
  borderRadius: "15px",
  boxShadow: "0px 4px 15px rgba(0,0,0,0.2)",
};

export const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "16px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  boxSizing: "border-box",
};

export const buttonStyle = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "12px 25px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  width: "100%",
};

export const secondaryButtonStyle = {
  ...buttonStyle,
  background: "#e2e8f0",
  color: "#0f172a",
  width: "auto",
};

export const topBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  maxWidth: "900px",
  margin: "0 auto 20px auto",
  color: "white",
};

export const statCardStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "18px 20px",
  boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
  flex: "1 1 160px",
  minWidth: "160px",
};

export const statCardsRowStyle = {
  display: "flex",
  gap: "14px",
  flexWrap: "wrap",
  maxWidth: "900px",
  margin: "0 auto 26px auto",
};

export function statusBadgeStyle(status) {
  const map = {
    applied: { bg: "#eef2ff", color: "#3730a3", border: "#c7d2fe" },
    shortlisted: { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
    rejected: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
  };
  const tone = map[status] || map.applied;
  return {
    display: "inline-block",
    background: tone.bg,
    color: tone.color,
    border: `1px solid ${tone.border}`,
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  };
}

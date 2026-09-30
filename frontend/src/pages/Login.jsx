import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { cardStyle, inputStyle, buttonStyle, pageStyle } from "../styles/shared";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(username, password);
      navigate(user.role === "recruiter" ? "/recruiter" : "/candidate");
    } catch (err) {
      setError(err.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, maxWidth: "420px" }}>
        <h1 style={{ color: "#0f172a", marginBottom: "6px" }}>AI Recruiter</h1>
        <p style={{ color: "#64748b", marginBottom: "24px" }}>Log in to continue</p>

        <form onSubmit={handleSubmit}>
          <input
            style={inputStyle}
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p style={{ color: "#dc2626", fontWeight: 600 }}>{error}</p>}

          <button style={buttonStyle} type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p style={{ marginTop: "18px", color: "#475569" }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

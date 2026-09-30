import { createContext, useContext, useState, useCallback } from "react";
import { BASE_URL } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("ai_recruiter_user");
    return raw ? JSON.parse(raw) : null;
  });

  const persistSession = (data) => {
    const sessionUser = { user_id: data.user_id, username: data.username, role: data.role };
    localStorage.setItem("ai_recruiter_token", data.access_token);
    localStorage.setItem("ai_recruiter_user", JSON.stringify(sessionUser));
    setUser(sessionUser);
    return sessionUser;
  };

  const login = useCallback(async (username, password) => {
    const form = new URLSearchParams();
    form.append("username", username);
    form.append("password", password);

    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Login failed");
    }

    const data = await res.json();
    return persistSession(data);
  }, []);

  const register = useCallback(async (username, password, role) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Registration failed");
    }

    const data = await res.json();
    return persistSession(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ai_recruiter_token");
    localStorage.removeItem("ai_recruiter_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}

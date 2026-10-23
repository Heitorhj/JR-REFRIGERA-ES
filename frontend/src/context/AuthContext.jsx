import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { AuthContext } from "./auth-context.js";
const storageKey = "jr-admin-token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(storageKey));
  const [usuario, setUsuario] = useState(null);
  const [checkingSession, setCheckingSession] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;

    let active = true;

    api("/api/auth/me", { token })
      .then((data) => {
        if (active) setUsuario(data.usuario);
      })
      .catch(() => {
        localStorage.removeItem(storageKey);
        if (active) {
          setToken(null);
          setUsuario(null);
        }
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const login = async (email, senha) => {
    const sessao = await api("/api/auth/login", {
      method: "POST",
      body: { email, senha }
    });

    localStorage.setItem(storageKey, sessao.token);
    setUsuario(sessao.usuario);
    setToken(sessao.token);
  };

  const logout = () => {
    localStorage.removeItem(storageKey);
    setToken(null);
    setUsuario(null);
  };

  const value = useMemo(
    () => ({ token, usuario, checkingSession, login, logout }),
    [token, usuario, checkingSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

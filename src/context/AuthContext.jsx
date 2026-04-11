import { useState, useCallback } from 'react';
import { authAPI } from '../services/api';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Inicializar user sincrónicamente desde localStorage (evita setState en useEffect)
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      const t = localStorage.getItem('token');
      return stored && t ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({
      email: email.trim().toLowerCase(),
      password,
    });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await authAPI.register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    role: user?.role || 'user',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

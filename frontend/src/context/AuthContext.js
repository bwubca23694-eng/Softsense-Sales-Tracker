import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const verify = useCallback(async () => {
    const token = localStorage.getItem('ss_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('api/auth/verify');
      setAdmin(data.admin);
    } catch {
      localStorage.removeItem('ss_token');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { verify(); }, [verify]);

  const login = async (username, password) => {
    const { data } = await api.post('/api/auth/login', { username, password });
    localStorage.setItem('ss_token', data.token);
    setAdmin(data.admin);
    return data;
  };

  const logout = () => { localStorage.removeItem('ss_token'); setAdmin(null); };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

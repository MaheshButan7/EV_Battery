import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login as authLogin, logout as authLogout, getSession } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = logged out

  useEffect(() => {
    getSession().then((session) => setUser(session ?? null));
  }, []);

  const login = useCallback(async (email, password) => {
    const session = await authLogin(email, password);
    setUser(session);
    return session;
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Wrap protected routes with this. Redirects to /login if unauthenticated,
 * then returns the user to the originally requested page after login.
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user === null) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
    }
  }, [user, loading, navigate, location]);

  if (loading) return null; // avoid flash
  if (!user) return null;
  return children;
}

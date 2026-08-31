import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser, getStoredToken, getStoredUser, setStoredAuth } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  // Validate stored session on mount
  useEffect(() => {
    async function initAuth() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getCurrentUser();
        if (data && data.user) {
          setUser(data.user);
          setStoredAuth(storedToken, data.user);
        }
      } catch (err) {
        console.warn('Session expired or invalid, clearing auth');
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await loginUser({ email, password });
    setToken(data.token);
    setUser(data.user);
    setStoredAuth(data.token, data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await registerUser({ name, email, password });
    setToken(data.token);
    setUser(data.user);
    setStoredAuth(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setStoredAuth(null, null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

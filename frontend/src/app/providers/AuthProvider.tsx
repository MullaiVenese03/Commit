import React, { useCallback, useEffect, useState } from 'react';
import type { LoginPayload, RegisterPayload } from '../../services/auth.service';
import { authService } from '../../services/auth.service';
import type { User } from '../../types';
import { storage } from '../../utils/storage';
import { AuthContext } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => storage.getUser());
  const [token, setToken] = useState<string | null>(() => storage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(() => !!storage.getToken());

  const logout = useCallback(() => {
    storage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = storage.getToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const freshUser = await authService.getMe();
      storage.setUser(freshUser);
      setUser(freshUser);
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    let isMounted = true;
    const currentToken = storage.getToken();
    if (currentToken) {
      authService
        .getMe()
        .then((freshUser) => {
          if (isMounted) {
            storage.setUser(freshUser);
            setUser(freshUser);
          }
        })
        .catch(() => {
          if (isMounted) {
            storage.clear();
            setToken(null);
            setUser(null);
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    }

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = async (credentials: LoginPayload) => {
    const response = await authService.login(credentials);
    storage.setToken(response.accessToken);
    storage.setUser(response.user);
    setToken(response.accessToken);
    setUser(response.user);
  };

  const register = async (payload: RegisterPayload) => {
    const response = await authService.register(payload);
    storage.setToken(response.accessToken);
    storage.setUser(response.user);
    setToken(response.accessToken);
    setUser(response.user);
  };

  const isMentor = user?.role === 'MENTOR';
  const isLearner = user?.role === 'LEARNER';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isMentor,
        isLearner,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

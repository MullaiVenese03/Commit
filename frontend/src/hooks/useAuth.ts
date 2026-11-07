import { useContext } from 'react';
import type { AuthContextType } from '../app/providers/AuthContext';
import { AuthContext } from '../app/providers/AuthContext';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

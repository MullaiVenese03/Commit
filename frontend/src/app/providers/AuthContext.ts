import { createContext } from 'react';
import type { LoginPayload, RegisterPayload } from '../../services/auth.service';
import type { User } from '../../types';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isMentor: boolean;
  isLearner: boolean;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

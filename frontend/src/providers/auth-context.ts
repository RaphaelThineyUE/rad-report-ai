import { createContext } from 'react';
import type { User } from '../types/domain';

export type AuthContextValue = {
  token: string | null;
  user: User | null;
  signIn: (token: string, user: User) => void;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

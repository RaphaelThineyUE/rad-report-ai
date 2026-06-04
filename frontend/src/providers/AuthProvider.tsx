import { useMemo, useState } from 'react';
import { clearSession, getStoredToken, getStoredUser, setStoredToken, setStoredUser } from '../lib/auth';
import type { User } from '../types/domain';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  const value = useMemo(
    () => ({
      token,
      user,
      signIn: (nextToken: string, nextUser: User) => {
        setStoredToken(nextToken);
        setStoredUser(nextUser);
        setToken(nextToken);
        setUser(nextUser);
      },
      signOut: () => {
        clearSession();
        setToken(null);
        setUser(null);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

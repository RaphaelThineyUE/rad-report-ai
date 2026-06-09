/**
 * React context that owns the Supabase authentication state for the entire app.
 * Initialises the session from Supabase storage on mount and listens for auth state changes.
 * Exports: AuthProvider (wraps the app), useAuth hook (returns user, session, isLoading,
 * logout, signInWithGoogle, signUp).
 * The session.access_token from this context is consumed by lib/api.ts for every API request.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: 'user' | 'admin' | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<'user' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);

          // Fetch user role from backend
          try {
            const response = await api.get('/api/auth/me');
            setRole(response.data.role);
          } catch (roleError) {
            console.error('Failed to fetch user role:', roleError);
            setRole('user');
          }
        }
      } catch (error) {
        console.error('Failed to get session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setRole(null);
      }
    });

    return () => { data.subscription.unsubscribe(); };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/worklist' },
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, role, isLoading, logout, signInWithGoogle, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

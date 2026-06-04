import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { User } from '../types/domain';

export const LoginPage = () => {
  const { token, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md">
        <Card className="p-6">
          <p className="text-sm text-primary">RadReport AI</p>
          <h1 className="mt-2 text-3xl font-semibold">Secure clinical sign in</h1>
          <p className="mt-2 text-sm text-foreground/60">JWT-authenticated access for protected patient and report workflows.</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setIsLoading(true);
              setError(null);
              try {
                const { data } = await api.post<{ token: string; user: User }>('/api/auth/login', { email, password });
                signIn(data.token, data.user);
              } catch {
                setError('Unable to sign in with those credentials.');
              } finally {
                setIsLoading(false);
              }
            }}
          >
            <Input type="email" placeholder="Email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <Input type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button className="w-full" disabled={isLoading}>{isLoading ? 'Signing in…' : 'Sign in'}</Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

/**
 * Error Boundary component — catches React render errors and displays a user-friendly fallback UI.
 * Features:
 * - Catches any error during rendering (not event handlers or async code)
 * - Displays error message without stack trace (production-friendly)
 * - Provides a retry button to recover from transient failures
 * - Logs errors to console in development
 * - Props: children (ReactNode), fallback? (custom fallback component)
 */
import type { ReactNode } from 'react';
import { Component } from 'react';
import { Icon } from '@/components/ui';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details in development
    if (import.meta.env.DEV) {
      console.error('Error Boundary caught:', error, errorInfo);
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }

      return (
        <div className="fade-up" style={{ padding: '24px' }}>
          <div className="card card-pad" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Icon
                name="alert-triangle"
                size={24}
                style={{ color: 'var(--error-600)', flexShrink: 0 }}
              />
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--fg-1)', margin: 0 }}>
                Something went wrong
              </h2>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--fg-2)', lineHeight: '1.5', marginBottom: '16px' }}>
              We encountered an unexpected error. Please try again, and if the problem persists,
              contact support.
            </p>

            {import.meta.env.DEV && (
              <div
                style={{
                  padding: '12px',
                  background: 'var(--slate-100)',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: 'var(--fg-3)',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  maxHeight: '120px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Error Details (dev only):</div>
                <div>{this.state.error.message}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={this.retry}
                style={{
                  padding: '10px 16px',
                  background: 'var(--primary-600)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-700)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--primary-600)')}
              >
                <Icon name="rotate-ccw" size={16} />
                Retry
              </button>

              <button
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  color: 'var(--primary-600)',
                  border: '1px solid var(--primary-200)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--primary-50)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

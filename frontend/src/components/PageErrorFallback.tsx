/**
 * PageErrorFallback — user-friendly error UI for page-level errors.
 * Used as the fallback for ErrorBoundary on pages that fetch data.
 * Displays error message with retry button and optional navigation.
 * Props: error (Error), resetErrorBoundary (() => void), title? (string), description? (string)
 */
import { Icon } from '@/components/ui';

interface PageErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  title?: string;
  description?: string;
}

export function PageErrorFallback({
  error,
  resetErrorBoundary,
  title = 'Unable to Load Page',
  description = 'An error occurred while loading this page. Please try again.',
}: PageErrorFallbackProps) {
  return (
    <div className="fade-up" style={{ padding: '24px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'start', gap: '16px', marginBottom: '20px' }}>
            <Icon
              name="alert-triangle"
              size={28}
              style={{ color: 'var(--error-600)', flexShrink: 0, marginTop: '2px' }}
            />
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--fg-1)', margin: '0 0 8px 0' }}>
                {title}
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--fg-2)', lineHeight: '1.6', margin: 0 }}>
                {description}
              </p>
            </div>
          </div>

          {import.meta.env.DEV && (
            <div
              style={{
                padding: '12px',
                background: 'var(--slate-100)',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '12px',
                color: 'var(--fg-3)',
                fontFamily: 'monospace',
                overflowX: 'auto',
                maxHeight: '100px',
                overflowY: 'auto',
                border: '1px solid var(--slate-200)',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Error Details:</div>
              <div>{error.message}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={resetErrorBoundary}
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
              Try Again
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
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-50)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

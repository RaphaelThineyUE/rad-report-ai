import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDemo: () => void;
  isLoading?: boolean;
}

export function OnboardingModal({ isOpen, onClose, onLoadDemo, isLoading }: OnboardingModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-xl)',
          maxWidth: 500,
          width: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '48px 32px',
          textAlign: 'center',
        }}
      >
        <Icon name="FileText" size={48} style={{ marginBottom: 16, color: 'var(--rose-600)' }} />

        <h2 className="t-h2" style={{ margin: '0 0 12px 0' }}>
          Welcome to RadReport AI
        </h2>

        <p style={{ margin: '0 0 24px 0', color: 'var(--fg-2)', fontSize: 15, lineHeight: 1.6 }}>
          Intelligent radiology report analysis powered by Claude AI. Get started by uploading patient reports or explore with demo data.
        </p>

        <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
          <div style={{ textAlign: 'left', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--r-sm)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Icon name="CheckCircle" size={20} style={{ color: 'var(--success-700)', marginTop: 2, flex: 'none' }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>AI-Powered Analysis</div>
                <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>
                  Automatic extraction of BI-RADS, findings, and recommendations
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'left', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--r-sm)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Icon name="Folder" size={20} style={{ color: 'var(--info-700)', marginTop: 2, flex: 'none' }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Patient Timeline</div>
                <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>
                  Track BI-RADS trends and treatment history over time
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'left', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--r-sm)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Icon name="Lock" size={20} style={{ color: 'var(--warning-700)', marginTop: 2, flex: 'none' }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Private & Secure</div>
                <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>
                  HIPAA-compliant storage with automatic PII redaction
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <Button
            variant="primary"
            style={{ width: '100%' }}
            onClick={onLoadDemo}
            disabled={isLoading}
            icon={isLoading ? 'Loader2' : undefined}
          >
            {isLoading ? 'Loading Demo Data…' : 'Load Demo Data'}
          </Button>
          <Button
            variant="secondary"
            style={{ width: '100%' }}
            onClick={onClose}
          >
            Start Fresh
          </Button>
        </div>

        <p style={{ margin: '20px 0 0 0', fontSize: 12, color: 'var(--fg-3)' }}>
          You can always load demo data later from the patients page.
        </p>
      </div>
    </>
  );
}

import { useState, useCallback, useEffect } from 'react';
import {
  useRegisterMfaListener,
  useMfa,
  errorIndicatesMfaVerificationFailed,
  errorIndicatesMaxMfaRetries,
  errorIndicatesMfaTimeout,
} from '@privy-io/react-auth';
import { createPortal } from 'react-dom';

export const MfaVerificationModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { init, submit, cancel } = useMfa();

  useRegisterMfaListener({
    onMfaRequired: async (params) => {
      const methods = params?.mfaMethods ?? params;
      if (Array.isArray(methods) && methods.includes('totp')) {
        setShowModal(true);
        setCode('');
        setError(null);
        setSubmitting(false);
        try {
          await init('totp');
        } catch (e: any) {
          setError(e?.message || 'Failed to initialize MFA');
        }
      }
    },
  });

  const handleSubmit = useCallback(async () => {
    if (code.length !== 6) return;
    try {
      setSubmitting(true);
      setError(null);
      await submit('totp', code);
      setShowModal(false);
      setCode('');
    } catch (e: unknown) {
      if (errorIndicatesMfaVerificationFailed(e)) {
        setError('Invalid code. Please try again.');
      } else if (errorIndicatesMaxMfaRetries(e)) {
        setError('Too many attempts. Please try again later.');
      } else if (errorIndicatesMfaTimeout(e)) {
        setError('Verification timed out. Please try again.');
      } else {
        setError((e as any)?.message || 'Verification failed.');
      }
      setCode('');
    } finally {
      setSubmitting(false);
    }
  }, [code, submit]);

  const handleCancel = useCallback(() => {
    cancel();
    setShowModal(false);
    setCode('');
    setError(null);
  }, [cancel]);

  // Hide Privy's native dialog when our MFA modal is shown
  useEffect(() => {
    if (!showModal) return;
    const style = document.createElement('style');
    style.setAttribute('data-mfa-override', 'true');
    style.textContent = `
      dialog[open] { display: none !important; }
      [data-privy-dialog] { display: none !important; }
      #privy-modal-content { display: none !important; }
      #privy-dialog { display: none !important; }
      #privy-dialog-backdrop { display: none !important; }
      [class*="privy-dialog"] { display: none !important; }
      [class*="privy-modal"] { display: none !important; }
      iframe[src*="privy.io"] { display: none !important; }
      [role="dialog"] { visibility: hidden !important; }
      [data-radix-portal] { visibility: hidden !important; }
    `;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, [showModal]);

  // Submit on Enter key
  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && code.length === 6 && !submitting) {
        handleSubmit();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, code, submitting, handleSubmit, handleCancel]);

  if (!showModal) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={handleCancel}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: '#1e1e2e',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          color: 'white',
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
          Enter verification code
        </h3>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 12px' }}>
          Enter the 6-digit code from your authenticator app to confirm this transaction.
        </p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="000000"
          style={{
            width: '100%',
            padding: '10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '18px',
            textAlign: 'center',
            letterSpacing: '8px',
            marginBottom: '12px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {error && (
          <p style={{ color: '#f87171', fontSize: '13px', margin: '0 0 12px' }}>
            {error}
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleCancel}
            style={{
              flex: 1,
              padding: '10px',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={code.length !== 6 || submitting}
            style={{
              flex: 1,
              padding: '10px',
              background: code.length === 6 && !submitting ? '#7155ef' : 'rgba(113,85,239,0.4)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: code.length === 6 && !submitting ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {submitting ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

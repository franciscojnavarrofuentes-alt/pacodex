import { useState, useCallback, useEffect, useRef } from 'react';
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
  const codeRef = useRef('');

  const { init, submit, cancel } = useMfa();

  useRegisterMfaListener({
    onMfaRequired: async (params) => {
      const methods = params?.mfaMethods ?? params;
      if (Array.isArray(methods) && methods.includes('totp')) {
        setShowModal(true);
        setCode('');
        codeRef.current = '';
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
    if (codeRef.current.length !== 6) return;
    try {
      setSubmitting(true);
      setError(null);
      await submit('totp', codeRef.current);
      setShowModal(false);
      setCode('');
      codeRef.current = '';
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
      codeRef.current = '';
    } finally {
      setSubmitting(false);
    }
  }, [submit]);

  const handleCancel = useCallback(() => {
    cancel();
    setShowModal(false);
    setCode('');
    codeRef.current = '';
    setError(null);
  }, [cancel]);

  // Hide Privy's native dialog and disable Radix FocusTrap when our MFA modal is shown
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

    // Set inert on all existing Radix portals and dialogs
    const setInertOnAll = () => {
      document.querySelectorAll('[data-radix-portal], [role="dialog"]').forEach((el) => {
        if (!el.hasAttribute('inert')) el.setAttribute('inert', '');
      });
    };
    setInertOnAll();

    // Watch for new portals/dialogs that appear while MFA modal is open
    const observer = new MutationObserver(() => setInertOnAll());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      style.remove();
      document.querySelectorAll('[data-radix-portal], [role="dialog"]').forEach((el) => {
        el.removeAttribute('inert');
      });
    };
  }, [showModal]);

  // Capture keyboard input globally - bypasses FocusTrap entirely
  // since we don't need the input to be focused to receive keystrokes
  useEffect(() => {
    if (!showModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in some other input (shouldn't happen with modal open)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key >= '0' && e.key <= '9' && codeRef.current.length < 6 && !submitting) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const newCode = codeRef.current + e.key;
        codeRef.current = newCode;
        setCode(newCode);
        // Auto-submit when 6 digits are entered
        if (newCode.length === 6) {
          setTimeout(() => handleSubmit(), 150);
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        e.stopImmediatePropagation();
        const newCode = codeRef.current.slice(0, -1);
        codeRef.current = newCode;
        setCode(newCode);
      } else if (e.key === 'Enter' && codeRef.current.length === 6 && !submitting) {
        e.preventDefault();
        e.stopImmediatePropagation();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        handleCancel();
      }
    };

    // Use capture phase to intercept before anything else
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [showModal, submitting, handleSubmit, handleCancel]);

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
        zIndex: 99999,
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
        {/* Display-only code boxes - keyboard input is captured globally */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            marginBottom: '12px',
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: '40px',
                height: '48px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${code.length === i ? '#7155ef' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 600,
                color: 'white',
              }}
            >
              {code[i] || ''}
            </div>
          ))}
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', margin: '0 0 12px' }}>
          Just type your code — no need to click
        </p>
        {error && (
          <p style={{ color: '#f87171', fontSize: '13px', margin: '0 0 12px' }}>
            {error}
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onMouseDown={(e) => { e.stopPropagation(); handleCancel(); }}
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
            onMouseDown={(e) => { e.stopPropagation(); if (code.length === 6 && !submitting) handleSubmit(); }}
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

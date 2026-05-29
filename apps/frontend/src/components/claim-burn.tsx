import React, { useMemo, useState } from 'react';

type Mode = 'claim' | 'burn';

type WalletState = 'disconnected' | 'connecting' | 'connected';

interface ClaimBurnProps {
  walletState?: WalletState;
  onConnect?: () => void;
  onClaim?: (amount: string) => Promise<void>;
  onBurn?: (amount: string) => Promise<void>;
}

const styles = {
  panel: {
    width: '100%',
    maxWidth: 420,
    minWidth: 0,
    margin: '0 auto',
    padding: 24,
    borderRadius: 24,
    background: '#ffffff',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 18,
    fontFamily: 'Inter, system-ui, sans-serif',
    boxSizing: 'border-box' as const,
  },
  walletPrompt: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.5,
    color: '#0f172a',
  },
  walletStatusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    padding: '8px 14px',
    background: '#ecfdf5',
    color: '#166534',
    fontSize: 13,
    fontWeight: 600,
  },
  button: {
    width: '100%',
    borderRadius: 14,
    border: 'none',
    padding: '14px 18px',
    fontSize: 16,
    cursor: 'pointer',
    transition: 'background 0.2s ease, transform 0.15s ease',
  },
  connectButton: {
    background: '#0f172a',
    color: '#ffffff',
  },
  actionButton: {
    background: '#0f172a',
    color: '#ffffff',
  },
  toggleGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  toggleButton: {
    borderRadius: 14,
    padding: '12px 0',
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    color: '#334155',
    cursor: 'pointer',
    fontSize: 15,
  },
  toggleActive: {
    background: '#0f172a',
    color: '#ffffff',
    border: '1px solid #0f172a',
  },
  fieldset: {
    display: 'grid',
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#475569',
  },
  input: {
    width: '100%',
    borderRadius: 16,
    border: '1px solid #cbd5e1',
    padding: '14px 16px',
    fontSize: 16,
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  feedback: {
    fontSize: 14,
    margin: 0,
  },
  successText: {
    color: '#16a34a',
  },
  errorText: {
    color: '#dc2626',
  },
};

export function ClaimBurn({
  walletState = 'disconnected',
  onConnect,
  onClaim,
  onBurn,
}: ClaimBurnProps) {
  const [mode, setMode] = useState<Mode>('claim');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const actionLabel = useMemo(() => (mode === 'claim' ? 'Claim' : 'Burn'), [mode]);
  const isSubmitDisabled =
    status === 'pending' || !amount || Number(amount) <= 0 || Number.isNaN(Number(amount));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setStatus('pending');
    setErrorMsg('');

    try {
      if (mode === 'claim') {
        await onClaim?.(amount);
      } else {
        await onBurn?.(amount);
      }
      setStatus('success');
      setAmount('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
    }
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setStatus('idle');
    setErrorMsg('');
  }

  if (walletState === 'disconnected') {
    return (
      <div data-testid="claim-burn" style={styles.panel}>
        <p style={styles.walletPrompt}>Connect your wallet to continue.</p>
        <button
          type="button"
          style={{ ...styles.button, ...styles.connectButton }}
          onClick={onConnect}
          data-testid="connect-wallet-btn"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (walletState === 'connecting') {
    return (
      <div data-testid="claim-burn" style={styles.panel}>
        <p style={styles.walletPrompt} data-testid="connecting-msg">
          Connecting…
        </p>
      </div>
    );
  }

  return (
    <div data-testid="claim-burn" style={styles.panel}>
      <div style={styles.walletStatusRow}>
        <p style={styles.walletPrompt} data-testid="connected-msg">
          Wallet connected. Choose Claim or Burn to continue.
        </p>
        <span style={styles.statusBadge}>Connected</span>
      </div>

      <div style={styles.toggleGroup} role="group" aria-label="Select action mode">
        {(['claim', 'burn'] as Mode[]).map((buttonMode) => {
          const active = mode === buttonMode;
          return (
            <button
              key={buttonMode}
              type="button"
              style={{
                ...styles.toggleButton,
                ...(active ? styles.toggleActive : {}),
              }}
              onClick={() => switchMode(buttonMode)}
              aria-pressed={active}
              data-testid={`toggle-${buttonMode}`}
            >
              {buttonMode === 'claim' ? 'Claim' : 'Burn'}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} data-testid="claim-burn-form" style={styles.fieldset}>
        <label htmlFor="amount" style={styles.label}>
          Amount (XLM)
        </label>
        <input
          id="amount"
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setStatus('idle');
            setErrorMsg('');
          }}
          placeholder="0.00"
          disabled={status === 'pending'}
          style={styles.input}
          data-testid="amount-input"
        />
        <button
          type="submit"
          style={{ ...styles.button, ...styles.actionButton, opacity: isSubmitDisabled ? 0.65 : 1 }}
          disabled={isSubmitDisabled}
          data-testid="submit-btn"
        >
          {status === 'pending' ? `${actionLabel}ing…` : actionLabel}
        </button>
      </form>

      <div aria-live="polite" aria-atomic="true">
        {status === 'success' && (
          <p
            role="status"
            style={{ ...styles.feedback, ...styles.successText }}
            data-testid="success-msg"
          >
            {mode === 'claim' ? 'Claimed successfully!' : 'Burned successfully!'}
          </p>
        )}

        {status === 'error' && (
          <p
            role="alert"
            style={{ ...styles.feedback, ...styles.errorText }}
            data-testid="error-msg"
          >
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}

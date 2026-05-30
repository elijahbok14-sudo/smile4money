import React, { useState, useEffect } from 'react';
import '../styles/claim-burn.css';

type Mode = 'claim' | 'burn';
type Status = 'idle' | 'confirm' | 'pending' | 'success' | 'error';

interface ClaimBurnProps {
  walletState: 'checking' | 'notInstalled' | 'disconnected' | 'connecting' | 'connected' | 'wrongNetwork' | 'error';
  onConnect?: () => void;
  onClaim?: (amount: string) => Promise<string | void>;
  onBurn?: (amount: string) => Promise<string | void>;
  onSwitchNetwork?: () => void;
  publicKey?: string | null;
  expectedNetwork?: string;
}

function isValidAmount(value: string): boolean {
  const n = Number(value);
  return value.trim() !== '' && !isNaN(n) && n > 0;
}

export function ClaimBurn({
  walletState,
  onConnect,
  onClaim,
  onBurn,
  onSwitchNetwork,
  publicKey,
  expectedNetwork = 'testnet',
}: ClaimBurnProps) {
  const [mode, setMode] = useState<Mode>('claim');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const isPending = status === 'pending';

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => setStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  function resetFeedback() {
    setStatus('idle');
    setTxHash(null);
    setErrorMsg('');
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
    if (status === 'error' || status === 'success') {
      resetFeedback();
    }
  }

  function handleToggle(newMode: Mode) {
    setMode(newMode);
    resetFeedback();
  }

  function handleRequestSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValidAmount(amount)) return;
    setStatus('confirm');
  }

  async function handleConfirm() {
    setStatus('pending');
    setErrorMsg('');
    setTxHash(null);
    try {
      const action = mode === 'claim' ? onClaim : onBurn;
      const hash = await action?.(amount);
      if (hash) setTxHash(hash);
      setStatus('success');
      setAmount('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
    }
  }

  function handleCancel() {
    setStatus('idle');
  }

  // Render wallet states
  if (walletState === 'checking' || walletState === 'connecting') {
    return (
      <div className="wallet-state" data-testid="wallet-connecting">
        <div className="spinner" />
        <p className="wallet-state-message">Connecting to Freighter&hellip;</p>
      </div>
    );
  }

  if (walletState === 'notInstalled') {
    return (
      <div className="wallet-state" data-testid="wallet-not-installed">
        <div className="wallet-state-icon">⚠️</div>
        <h3 className="wallet-state-title">Freighter Not Found</h3>
        <p className="wallet-state-message">
          Please install the{' '}
          <a href="https://freighter.app" target="_blank" rel="noopener noreferrer">
            Freighter wallet extension
          </a>{' '}
          to continue.
        </p>
      </div>
    );
  }

  if (walletState === 'disconnected') {
    return (
      <div className="wallet-state" data-testid="wallet-disconnected">
        <div className="wallet-state-icon">💼</div>
        <h3 className="wallet-state-title">Connect Your Wallet</h3>
        <p className="wallet-state-message">
          Connect your Freighter wallet to claim rewards or burn tokens.
        </p>
        <button
          className="btn btn-connect"
          onClick={onConnect}
          data-testid="connect-wallet-btn"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (walletState === 'wrongNetwork') {
    return (
      <div className="wallet-state" data-testid="wallet-wrong-network">
        <div className="wallet-state-icon">🌐</div>
        <h3 className="wallet-state-title">Wrong Network</h3>
        <p className="wallet-state-message">
          Please switch your Freighter wallet to <strong>{expectedNetwork}</strong>.
        </p>
        <button
          className="btn btn-switch-network"
          onClick={onSwitchNetwork}
          data-testid="switch-network-btn"
        >
          Switch to {expectedNetwork}
        </button>
      </div>
    );
  }

  // Render connected form
  return (
    <div className="claim-burn" data-testid="claim-burn">
      <h2 className="claim-burn-title">Claim &amp; Burn</h2>

      {/* Toggle */}
      <div className="toggle" role="group" aria-label="Select mode">
        <button
          type="button"
          className={`toggle-btn${mode === 'claim' ? ' active' : ''}`}
          onClick={() => handleToggle('claim')}
          aria-pressed={mode === 'claim'}
          data-testid="toggle-claim"
        >
          Claim
        </button>
        <button
          type="button"
          className={`toggle-btn${mode === 'burn' ? ' active' : ''}`}
          onClick={() => handleToggle('burn')}
          aria-pressed={mode === 'burn'}
          data-testid="toggle-burn"
        >
          Burn
        </button>
      </div>

      {/* Wallet Info */}
      {publicKey && (
        <div className="wallet-info" data-testid="wallet-info">
          <span className="wallet-info-label">Connected</span>
          <span className="wallet-info-address">
            {publicKey.slice(0, 4)}&hellip;{publicKey.slice(-4)}
          </span>
        </div>
      )}

      {/* Confirmation Overlay */}
      {status === 'confirm' && (
        <div className="confirm-overlay" data-testid="confirm-overlay">
          <p className="confirm-text">
            {mode === 'claim' ? 'Claim' : 'Burn'} <strong>{amount}</strong> XLM?
          </p>
          <div className="confirm-buttons">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={handleCancel}
              data-testid="cancel-btn"
            >
              Cancel
            </button>
            <button
              type="button"
              className={`btn btn-${mode}`}
              onClick={handleConfirm}
              disabled={isPending}
              data-testid="confirm-btn"
            >
              {isPending
                ? mode === 'claim'
                  ? 'Claiming…'
                  : 'Burning…'
                : 'Confirm'}
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      {status !== 'confirm' && (
        <form onSubmit={handleRequestSubmit} data-testid="claim-burn-form">
          <div className="form-group">
            <label htmlFor="amount-input">Amount (XLM)</label>
            <input
              id="amount-input"
              type="number"
              step="0.0000001"
              min="0"
              placeholder="Enter amount"
              value={amount}
              onChange={handleAmountChange}
              disabled={isPending}
              data-testid="amount-input"
            />
          </div>

          <button
            type="submit"
            className={`btn btn-${mode}`}
            disabled={isPending || !isValidAmount(amount)}
            data-testid="submit-btn"
          >
            {isPending
              ? mode === 'claim'
                ? 'Claiming…'
                : 'Burning…'
              : mode === 'claim'
              ? 'Claim'
              : 'Burn'}
          </button>

          {/* Feedback Messages */}
          {status === 'success' && (
            <div
              className="feedback success"
              role="status"
              aria-live="polite"
              data-testid="success-msg"
            >
              ✓ Transaction successful!
              {txHash && <div className="tx-hash">{txHash}</div>}
            </div>
          )}

          {status === 'error' && (
            <div
              className="feedback error"
              role="alert"
              aria-live="assertive"
              data-testid="error-msg"
            >
              ✗ {errorMsg}
            </div>
          )}
        </form>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import type { WalletState, Mode } from '../types';

interface ClaimBurnProps {
  walletState: WalletState;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onClaim?: (amount: string) => Promise<void>;
  onBurn?: (amount: string) => Promise<void>;
}

function formatAddress(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function isPositiveNumber(val: string): boolean {
  const n = Number(val);
  return val !== '' && !Number.isNaN(n) && n > 0;
}

export function ClaimBurn({
  walletState,
  onConnect,
  onDisconnect,
  onClaim,
  onBurn,
}: ClaimBurnProps) {
  const [mode, setMode] = useState<Mode>('claim');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isPositiveNumber(amount)) return;

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

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
    if (status === 'success' || status === 'error') {
      setStatus('idle');
    }
  }

  function handleToggle(newMode: Mode) {
    setMode(newMode);
    if (status === 'success' || status === 'error') {
      setStatus('idle');
    }
  }

  if (walletState.status === 'disconnected') {
    return (
      <div className="claim-burn" data-testid="claim-burn">
        <p className="wallet-prompt">Connect your Freighter wallet to continue</p>
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

  if (walletState.status === 'connecting') {
    return (
      <div className="claim-burn" data-testid="claim-burn">
        <p className="wallet-connecting" data-testid="connecting-msg">
          Connecting to Freighter…
        </p>
      </div>
    );
  }

  if (walletState.status === 'error') {
    return (
      <div className="claim-burn" data-testid="claim-burn">
        <div className="wallet-error">
          <p data-testid="wallet-error-msg">
            {walletState.error || 'An unknown error occurred'}
          </p>
          <button
            className="btn btn-connect"
            onClick={onConnect}
            data-testid="retry-connect-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="claim-burn" data-testid="claim-burn">
      <div className="wallet-info">
        <span className="wallet-address" data-testid="wallet-address">
          {formatAddress(walletState.address || '')}
        </span>
        {onDisconnect && (
          <button
            className="btn btn-disconnect"
            onClick={onDisconnect}
            data-testid="disconnect-btn"
          >
            Disconnect
          </button>
        )}
      </div>

      <div className="toggle" role="group" aria-label="Select mode">
        <button
          className={`toggle-btn${mode === 'claim' ? ' active' : ''}`}
          onClick={() => handleToggle('claim')}
          aria-pressed={mode === 'claim'}
          data-testid="toggle-claim"
        >
          Claim
        </button>
        <button
          className={`toggle-btn${mode === 'burn' ? ' active' : ''}`}
          onClick={() => handleToggle('burn')}
          aria-pressed={mode === 'burn'}
          data-testid="toggle-burn"
        >
          Burn
        </button>
      </div>

      <form onSubmit={handleSubmit} className="claim-burn-form" data-testid="claim-burn-form">
        <label htmlFor="amount">
          {mode === 'claim' ? 'Amount to claim' : 'Amount to burn'}
          {walletState.balance !== null && (
            <span style={{ marginLeft: '0.5rem', fontWeight: 400, color: '#94a3b8' }}>
              (Balance: {walletState.balance} XLM)
            </span>
          )}
        </label>
        <input
          id="amount"
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={handleAmountChange}
          placeholder="0.00"
          disabled={status === 'pending'}
          data-testid="amount-input"
        />
        <button
          type="submit"
          className={`btn btn-${mode}`}
          disabled={status === 'pending' || !isPositiveNumber(amount)}
          data-testid="submit-btn"
        >
          {status === 'pending'
            ? 'Processing…'
            : mode === 'claim'
              ? 'Claim'
              : 'Burn'}
        </button>
      </form>

      <div aria-live="polite" aria-atomic="true">
        {status === 'success' && (
          <p className="feedback success" role="status" data-testid="success-msg">
            {mode === 'claim' ? 'Claimed successfully!' : 'Burned successfully!'}
          </p>
        )}
        {status === 'error' && (
          <p className="feedback error" role="alert" data-testid="error-msg">
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}

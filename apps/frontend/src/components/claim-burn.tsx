import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/claim-burn.css';
import type { WalletStatus } from '../types';

type Mode = 'claim' | 'burn';
type Status = 'idle' | 'confirm' | 'pending' | 'success' | 'error';

interface TxRecord {
  mode: Mode;
  amount: string;
  hash: string | null;
  timestamp: number;
}

interface ClaimBurnProps {
  walletState: WalletStatus;
  onConnect?: () => void;
  onClaim?: (amount: string) => Promise<string | void>;
  onBurn?: (amount: string) => Promise<string | void>;
  onSwitchNetwork?: () => void;
  onDisconnect?: () => void;
  onRefreshBalance?: () => void;
  publicKey?: string | null;
  balance?: string | null;
  expectedNetwork?: string;
  tokenSymbol?: string;
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
  onDisconnect,
  onRefreshBalance,
  publicKey,
  balance,
  expectedNetwork = 'testnet',
  tokenSymbol = 'XLM',
}: ClaimBurnProps) {
  const [mode, setMode] = useState<Mode>('claim');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Auto-dismiss success after 3s
  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(() => setStatus('idle'), 3000);
      return () => clearTimeout(t);
    }
  }, [status]);

  // Focus confirm button when overlay appears
  useEffect(() => {
    if (status === 'confirm') {
      confirmBtnRef.current?.focus();
    }
  }, [status]);

  function resetFeedback() {
    setStatus('idle');
    setTxHash(null);
    setErrorMsg('');
  }

  function handleToggle(newMode: Mode) {
    setMode(newMode);
    resetFeedback();
    setTimeout(() => amountInputRef.current?.focus(), 0);
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
    if (status === 'error' || status === 'success') resetFeedback();
  }

  function handleMax() {
    if (balance != null) {
      setAmount(balance);
      resetFeedback();
    }
  }

  function handleRequestSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValidAmount(amount)) {
      setStatus('error');
      setErrorMsg('Please enter a valid amount greater than 0.');
      setTxHash(null);
      return;
    }
    if (walletState !== 'connected') {
      setStatus('error');
      setErrorMsg('Connect your wallet to continue.');
      setTxHash(null);
      return;
    }
    setStatus('confirm');
  }

  const handleConfirm = useCallback(async () => {
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
  }, [mode, onClaim, onBurn, amount]);

  function handleCancel() {
    setStatus('idle');
    setTimeout(() => amountInputRef.current?.focus(), 0);
  }

  const isPending = status === 'pending';
  const showConfirm = status === 'confirm';
  const valid = isValidAmount(amount);

  // ── Wallet state screens ──────────────────────────────────────────

  if (walletState === 'checking' || walletState === 'connecting') {
    return (
      <div className="wallet-state" data-testid="wallet-connecting">
        <div className="spinner" />
        <p className="wallet-state-message">Connecting to wallet&hellip;</p>
      </div>
    );
  }

  if (walletState === 'notInstalled') {
    return (
      <div className="wallet-state" data-testid="wallet-not-installed">
        <span className="wallet-state-icon">⚠️</span>
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
      <div className="claim-burn" data-testid="wallet-disconnected">
        <h2 className="claim-burn-title">Claim &amp; Burn</h2>
        <div className="wallet-state" data-testid="wallet-disconnected-state">
          <span className="wallet-state-icon">💼</span>
          <h3 className="wallet-state-title">Connect Your Wallet</h3>
          <p className="wallet-state-message">
            Connect your Freighter wallet to claim rewards or burn tokens.
          </p>
          <button
            className="btn btn-connect focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            onClick={onConnect}
            data-testid="connect-wallet-btn"
            aria-label="Connect wallet"
          >
            Connect Wallet
          </button>
        </div>
        <form
          onSubmit={handleRequestSubmit}
          data-testid="claim-burn-form"
          aria-label={`${mode === 'claim' ? 'Claim' : 'Burn'} tokens`}
        >
          <div className="form-group">
            <label htmlFor="amount-input">Amount ({tokenSymbol})</label>
            <div className="input-row">
              <input
                ref={amountInputRef}
                id="amount-input"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={handleAmountChange}
                disabled
                placeholder="0.00"
                data-testid="amount-input"
                aria-invalid={amount !== '' && !valid}
                aria-label={`${mode === 'claim' ? 'Claim' : 'Burn'} amount`}
                aria-describedby={status === 'error' ? 'claim-burn-error' : undefined}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              />
            </div>
          </div>
          <button
            type="submit"
            className={`btn btn-${mode} focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2`}
            disabled={true}
            data-testid="submit-btn"
            aria-busy={isPending}
            aria-label={`${mode === 'claim' ? 'Claim' : 'Burn'} disabled until wallet is connected`}
          >
            {mode === 'claim' ? 'Claim' : 'Burn'}
          </button>
        </form>
        {status === 'error' && (
          <p className="feedback error" role="alert" data-testid="error-msg" id="claim-burn-error">
            {errorMsg}
          </p>
        )}
      </div>
    );
  }

  if (walletState === 'wrongNetwork') {
    return (
      <div className="wallet-state" data-testid="wallet-wrong-network">
        <span className="wallet-state-icon">🌐</span>
        <h3 className="wallet-state-title">Wrong Network</h3>
        <p className="wallet-state-message">
          Please switch your Freighter wallet to{' '}
          <strong>{expectedNetwork}</strong>.
        </p>
        <button
          className="btn btn-switch-network"
          onClick={onSwitchNetwork}
          data-testid="switch-network-btn"
          aria-label={`Switch to ${expectedNetwork} network`}
        >
          Switch to {expectedNetwork}
        </button>
      </div>
    );
  }

  if (walletState === 'error') {
    return (
      <div className="wallet-state" data-testid="wallet-error">
        <span className="wallet-state-icon">⚠️</span>
        <h3 className="wallet-state-title">Connection Error</h3>
        <p className="wallet-state-message">
          An error occurred while connecting to your wallet.
        </p>
        <button
          className="btn btn-connect"
          onClick={onConnect}
          data-testid="retry-connect-btn"
          aria-label="Retry wallet connection"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Connected UI ──────────────────────────────────────────────────

  return (
    <div className="claim-burn" data-testid="claim-burn">
      <h2 className="claim-burn-title">Claim &amp; Burn</h2>

      {/* Mode toggle */}
      <div className="toggle" role="group" aria-label="Select mode">
        <button
          type="button"
          className={`toggle-btn${mode === 'claim' ? ' active' : ''} focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2`}
          onClick={() => handleToggle('claim')}
          aria-pressed={mode === 'claim'}
          data-testid="toggle-claim"
          aria-label="Switch to claim mode"
        >
          Claim
        </button>
        <button
          type="button"
          className={`toggle-btn${mode === 'burn' ? ' active' : ''} focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2`}
          onClick={() => handleToggle('burn')}
          aria-pressed={mode === 'burn'}
          data-testid="toggle-burn"
          aria-label="Switch to burn mode"
        >
          Burn
        </button>
      </div>

      {/* Wallet info */}
      {publicKey && (
        <div className="wallet-info" data-testid="wallet-info">
          <div className="wallet-info-row">
            <span className="wallet-info-label">Connected</span>
            <span className="wallet-info-address">
              {publicKey.slice(0, 4)}&hellip;{publicKey.slice(-4)}
            </span>
            {onDisconnect && (
              <button
                className="btn-disconnect focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                onClick={onDisconnect}
                data-testid="disconnect-btn"
                aria-label="Disconnect wallet"
              >
                Disconnect
              </button>
            )}
          </div>
          {balance != null && (
            <div className="wallet-balance-row">
              <span className="wallet-balance-label">Balance</span>
              <span
                className="wallet-balance-value"
                data-testid="wallet-balance"
                aria-label={`${balance} ${tokenSymbol}`}
              >
                {balance} {tokenSymbol}
              </span>
              {onRefreshBalance && (
                <button
                  className="btn-refresh-balance"
                  onClick={onRefreshBalance}
                  data-testid="refresh-balance-btn"
                  aria-label="Refresh balance"
                >
                  ↻
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation overlay */}
      {showConfirm && (
        <div
          className="confirm-overlay"
          data-testid="confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Confirm ${mode}`}
        >
          <p className="confirm-text">
            {mode === 'claim' ? 'Claim' : 'Burn'} <strong>{amount}</strong> {tokenSymbol}?
          </p>
          <div className="confirm-buttons">
            <button
              type="button"
              className="btn btn-cancel focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              onClick={handleCancel}
              data-testid="cancel-btn"
              aria-label="Cancel confirmation"
            >
              Cancel
            </button>
            <button
              ref={confirmBtnRef}
              type="button"
              className={`btn btn-${mode} focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2`}
              onClick={handleConfirm}
              data-testid="confirm-btn"
              aria-label={`Confirm ${mode}`}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Amount form */}
      <form
        onSubmit={handleRequestSubmit}
        data-testid="claim-burn-form"
        aria-label={`${mode === 'claim' ? 'Claim' : 'Burn'} tokens`}
      >
        <div className="form-group">
          <label htmlFor="amount-input">Amount ({tokenSymbol})</label>
          <div className="input-row">
            <input
              ref={amountInputRef}
              id="amount-input"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={handleAmountChange}
              disabled={isPending}
              placeholder="0.00"
              data-testid="amount-input"
              aria-invalid={amount !== '' && !valid}
              aria-label={`${mode === 'claim' ? 'Claim' : 'Burn'} amount`}
              aria-describedby={status === 'error' ? 'claim-burn-error' : undefined}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            />
            {mode === 'burn' && balance != null && (
              <button
                type="button"
                className="btn-max focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                onClick={handleMax}
                disabled={isPending}
                data-testid="max-btn"
                aria-label="Use maximum balance"
              >
                Max
              </button>
            )}
          </div>
        </div>

        {!showConfirm && (
          <button
            type="submit"
            className={`btn btn-${mode} focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2`}
            disabled={isPending || !valid || walletState !== 'connected'}
            data-testid="submit-btn"
            aria-busy={isPending}
            aria-label={`${mode === 'claim' ? 'Claim' : 'Burn'} tokens`}
          >
            {isPending
              ? mode === 'claim' ? 'Claiming…' : 'Burning…'
              : mode === 'claim' ? 'Claim' : 'Burn'}
          </button>
        )}
      </form>

      {/* Feedback */}
      {status === 'success' && (
        <p className="feedback success" role="status" data-testid="success-msg">
          {mode === 'claim'
            ? `${tokenSymbol} claimed successfully!`
            : `${tokenSymbol} burned successfully!`}
          {txHash && (
            <span className="tx-hash" data-testid="tx-hash">
              {txHash.slice(0, 8)}…{txHash.slice(-8)}
            </span>
          )}
        </p>
      )}
      {status === 'error' && (
        <p className="feedback error" role="alert" data-testid="error-msg" id="claim-burn-error">
          {errorMsg}
        </p>
      )}
    </div>
  );
}

export default ClaimBurn;

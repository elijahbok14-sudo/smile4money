import React, { useState } from 'react';
import '../styles/claim-burn.css';

type Mode = 'claim' | 'burn';
type Phase = 'idle' | 'confirm' | 'pending' | 'success' | 'error';

type WalletStateProp =
  | string
  | { status: string; balance?: string | null };

interface ClaimBurnProps {
  walletState: WalletStateProp;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onRefreshBalance?: () => void;
  onClaim?: (amount: string) => Promise<string | void>;
  onBurn?: (amount: string) => Promise<string | void>;
  onSwitchNetwork?: () => void;
  publicKey?: string | null;
  expectedNetwork?: string;
  balance?: string | null;
}

function isValidAmount(value: string): boolean {
  const n = Number(value);
  return value.trim() !== '' && !isNaN(n) && n > 0;
}

export function ClaimBurn({
  walletState,
  onConnect,
  onDisconnect,
  onRefreshBalance,
  onClaim,
  onBurn,
  onSwitchNetwork,
  publicKey,
  expectedNetwork = 'testnet',
  balance: balanceProp,
}: ClaimBurnProps) {
  const [mode, setMode] = useState<Mode>('claim');
  const [amount, setAmount] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const stateKey =
    typeof walletState === 'string' ? walletState : walletState.status;
  const walletBalance =
    balanceProp !== undefined
      ? balanceProp
      : typeof walletState === 'object'
        ? (walletState.balance ?? null)
        : null;

  function resetFeedback() {
    setPhase('idle');
    setTxHash(null);
    setErrorMsg('');
  }

  function handleModeChange(newMode: Mode) {
    setMode(newMode);
    resetFeedback();
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
    if (phase === 'error' || phase === 'success') {
      resetFeedback();
    }
  }

  function handleMax() {
    if (walletBalance !== null && walletBalance !== undefined) {
      setAmount(walletBalance);
      resetFeedback();
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValidAmount(amount)) return;
    setPhase('confirm');
  }

  async function handleConfirm() {
    setPhase('pending');
    setErrorMsg('');
    setTxHash(null);
    try {
      const action = mode === 'claim' ? onClaim : onBurn;
      const hash = await action?.(amount);
      if (hash) setTxHash(hash);
      setPhase('success');
      setAmount('');
    } catch (err) {
      setPhase('error');
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
    }
  }

  function handleCancel() {
    setPhase('idle');
  }

  // ── Wallet state screens ──────────────────────────────────────────

  if (stateKey === 'checking' || stateKey === 'connecting') {
    return (
      <div className="claim-burn" data-testid="claim-burn">
        <h2 className="claim-burn-title">Claim &amp; Burn</h2>
        <div className="wallet-state" data-testid="wallet-connecting">
          <div className="spinner" />
          <p className="wallet-state-message">Connecting to Freighter&hellip;</p>
        </div>
      </div>
    );
  }

  if (stateKey === 'notInstalled') {
    return (
      <div className="claim-burn" data-testid="claim-burn">
        <h2 className="claim-burn-title">Claim &amp; Burn</h2>
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
      </div>
    );
  }

  if (stateKey === 'disconnected') {
    return (
      <div className="claim-burn" data-testid="claim-burn">
        <h2 className="claim-burn-title">Claim &amp; Burn</h2>
        <div className="wallet-state" data-testid="wallet-disconnected">
          <div className="wallet-state-icon">💼</div>
          <h3 className="wallet-state-title">Connect Your Wallet</h3>
          <p className="wallet-state-message">
            Connect your Freighter wallet to claim rewards or burn tokens.
          </p>
          <button className="btn btn-connect" onClick={onConnect} data-testid="connect-wallet-btn">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (stateKey === 'wrongNetwork') {
    return (
      <div className="claim-burn" data-testid="claim-burn">
        <h2 className="claim-burn-title">Claim &amp; Burn</h2>
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
      </div>
    );
  }

  if (stateKey === 'error') {
    return (
      <div className="claim-burn" data-testid="claim-burn">
        <h2 className="claim-burn-title">Claim &amp; Burn</h2>
        <div className="wallet-state" data-testid="wallet-error">
          <div className="wallet-state-icon">⚠️</div>
          <h3 className="wallet-state-title">Connection Error</h3>
          <p className="wallet-state-message">
            An error occurred while connecting to your wallet.
          </p>
          <button className="btn btn-connect" onClick={onConnect} data-testid="retry-connect-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Connected form ────────────────────────────────────────────────

  const isPending = phase === 'pending';
  // Show Max always when balance comes from direct prop; only in burn mode when from walletState object
  const showMax =
    walletBalance !== null &&
    walletBalance !== undefined &&
    (balanceProp !== undefined ? true : mode === 'burn');

  return (
    <div className="claim-burn" data-testid="claim-burn">
      <h2 className="claim-burn-title">Claim &amp; Burn</h2>

      <div className="toggle" role="group" aria-label="Select mode">
        <button
          type="button"
          className={`toggle-btn${mode === 'claim' ? ' active' : ''}`}
          onClick={() => handleModeChange('claim')}
          aria-pressed={mode === 'claim'}
          data-testid="toggle-claim"
        >
          Claim
        </button>
        <button
          type="button"
          className={`toggle-btn${mode === 'burn' ? ' active' : ''}`}
          onClick={() => handleModeChange('burn')}
          aria-pressed={mode === 'burn'}
          data-testid="toggle-burn"
        >
          Burn
        </button>
      </div>

      {publicKey && (
        <div className="wallet-info" data-testid="wallet-info">
          <div className="wallet-info-row">
            <span className="wallet-info-label">Connected</span>
            <span className="wallet-info-address">
              {publicKey.slice(0, 4)}&hellip;{publicKey.slice(-4)}
            </span>
            {onDisconnect && (
              <button
                className="btn-disconnect"
                onClick={onDisconnect}
                data-testid="disconnect-btn"
              >
                Disconnect
              </button>
            )}
          </div>
          {walletBalance !== null && walletBalance !== undefined && onRefreshBalance && (
            <div className="wallet-balance-row">
              <span className="wallet-balance-label">Balance</span>
              <span className="wallet-balance-value" data-testid="wallet-balance">
                {walletBalance} XLM
              </span>
              <button
                className="btn-refresh-balance"
                onClick={onRefreshBalance}
                data-testid="refresh-balance-btn"
                title="Refresh balance"
              >
                ↻
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'confirm' ? (
        <>
          <div className="input-row">
            <input
              id="amount"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              data-testid="amount-input"
            />
          </div>
          <div className="confirm-overlay" data-testid="confirm-overlay">
            <p className="confirm-text">
              Confirm {mode} of <strong>{amount}</strong> XLM?
            </p>
            <button
              type="button"
              className="btn btn-confirm"
              onClick={handleConfirm}
              data-testid="confirm-btn"
            >
              Confirm
            </button>
            <button
              type="button"
              className="btn btn-cancel"
              onClick={handleCancel}
              data-testid="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} data-testid="claim-burn-form">
          <label htmlFor="amount">Amount (XLM)</label>
          <div className="input-row">
            <input
              id="amount"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              disabled={isPending}
              data-testid="amount-input"
            />
            {showMax && (
              <button
                type="button"
                className="btn-max"
                onClick={handleMax}
                disabled={isPending}
                data-testid="max-btn"
              >
                Max
              </button>
            )}
          </div>
          <button
            type="submit"
            className={`btn btn-${mode}`}
            disabled={isPending || !isValidAmount(amount)}
            data-testid="submit-btn"
          >
            {isPending
              ? mode === 'claim'
                ? 'Claiming\u2026'
                : 'Burning\u2026'
              : mode === 'claim'
                ? 'Claim'
                : 'Burn'}
          </button>
        </form>
      )}

      <div aria-live="polite" aria-atomic="true">
        {phase === 'success' && (
          <div className="feedback success" role="status" data-testid="success-msg">
            {mode === 'claim' ? 'XLM claimed successfully!' : 'XLM burned successfully!'}
            {txHash && (
              <p className="tx-hash" data-testid="tx-hash">
                TX: {txHash.slice(0, 8)}&hellip;{txHash.slice(-6)}
              </p>
            )}
          </div>
        )}
        {phase === 'error' && (
          <p className="feedback error" role="alert" data-testid="error-msg">
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}

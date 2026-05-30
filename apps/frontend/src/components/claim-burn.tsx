import React, { useState, useMemo, useEffect } from 'react';
import '../styles/claim-burn.css';
import type { WalletStatus } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'claim' | 'burn';
type Phase = 'idle' | 'confirm' | 'pending' | 'success' | 'error';

export interface ClaimBurnProps {
  walletState: WalletStatus | { status: WalletStatus; balance?: string | null };
  /** Top-level balance shorthand */
  balance?: string | null;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onRefreshBalance?: () => void;
  onClaim?: (amount: string) => Promise<string | void>;
  onBurn?: (amount: string) => Promise<string | void>;
  onSwitchNetwork?: () => void;
  publicKey?: string | null;
  expectedNetwork?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidAmount(value: string): boolean {
  const n = Number(value);
  return value.trim() !== '' && !Number.isNaN(n) && n > 0;
}

function stripTrailingZeros(value: string): string {
  return String(parseFloat(value));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClaimBurn({
  walletState,
  balance: balanceProp,
  onConnect,
  onDisconnect,
  onRefreshBalance,
  onClaim,
  onBurn,
  onSwitchNetwork,
  publicKey,
  expectedNetwork = 'testnet',
}: ClaimBurnProps) {
  const [mode, setMode] = useState<Mode>('claim');
  const [amount, setAmount] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  // Normalise walletState
  const status: WalletStatus =
    typeof walletState === 'string' ? walletState : walletState.status;

  // Balance: prefer top-level prop, then walletState object field
  const balance: string | null =
    balanceProp !== undefined
      ? (balanceProp ?? null)
      : typeof walletState === 'object'
        ? (walletState.balance ?? null)
        : null;

  const balanceNum = useMemo(
    () => (balance !== null ? Number(balance) : null),
    [balance],
  );

  const exceedsBalance = useMemo(
    () =>
      mode === 'burn' &&
      balanceNum !== null &&
      isValidAmount(amount) &&
      Number(amount) > balanceNum,
    [amount, balanceNum, mode],
  );

  const isValid = isValidAmount(amount) && !exceedsBalance;

  // Auto-hide success after 3 seconds
  useEffect(() => {
    if (phase !== 'success') return;
    const timer = setTimeout(() => setPhase('idle'), 3000);
    return () => clearTimeout(timer);
  }, [phase]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function resetFeedback() {
    setPhase('idle');
    setTxHash(null);
    setErrorMsg('');
  }

  function handleModeChange(next: Mode) {
    setMode(next);
    resetFeedback();
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
    if (phase === 'error' || phase === 'success') resetFeedback();
  }

  function handleMax() {
    if (balance !== null) {
      setAmount(stripTrailingZeros(balance));
      resetFeedback();
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValid) return;
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

  // ─── Render helpers ─────────────────────────────────────────────────────────

  function renderNotInstalled() {
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

  function renderDisconnected() {
    return (
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
    );
  }

  function renderConnecting() {
    return (
      <div className="wallet-state" data-testid="wallet-connecting">
        <div className="spinner" />
        <p className="wallet-state-message">Connecting to Freighter…</p>
      </div>
    );
  }

  function renderWrongNetwork() {
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

  function renderError() {
    return (
      <div className="wallet-state" data-testid="wallet-error">
        <div className="wallet-state-icon">⚠️</div>
        <h3 className="wallet-state-title">Connection Error</h3>
        <p className="wallet-state-message">
          {errorMsg || 'An error occurred while connecting to your wallet.'}
        </p>
        <button className="btn btn-connect" onClick={onConnect} data-testid="retry-connect-btn">
          Try Again
        </button>
      </div>
    );
  }

  function renderForm() {
    const isPending = phase === 'pending';
    const pendingLabel = mode === 'claim' ? 'Claiming…' : 'Burning…';

    return (
      <>
        {/* Mode toggle */}
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

        {/* Wallet info bar */}
        {publicKey && (
          <div className="wallet-info" data-testid="wallet-info">
            <div className="wallet-info-row">
              <span className="wallet-info-label">Connected</span>
              <span className="wallet-info-address">
                {publicKey.slice(0, 4)}…{publicKey.slice(-4)}
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
            {balance !== null && (
              <div className="wallet-balance-row">
                <span className="wallet-balance-label">Balance</span>
                <span className="wallet-balance-value" data-testid="wallet-balance">
                  {stripTrailingZeros(balance)} XLM
                </span>
                {onRefreshBalance && (
                  <button
                    className="btn-refresh-balance"
                    onClick={onRefreshBalance}
                    data-testid="refresh-balance-btn"
                    title="Refresh balance"
                  >
                    ↻
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Confirmation overlay */}
        {phase === 'confirm' && (
          <div className="confirm-overlay" data-testid="confirm-overlay">
            <p className="confirm-text">
              Confirm {mode} of <strong>{amount}</strong> XLM?
            </p>
            <button
              type="button"
              className={`btn btn-${mode}`}
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
        )}

        {/* Amount form — hidden during confirm phase */}
        {phase !== 'confirm' && (
          <form onSubmit={handleSubmit} data-testid="claim-burn-form">
            <label htmlFor="amount">
              {mode === 'claim' ? 'Claim amount' : 'Burn amount'} (XLM)
            </label>
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
                aria-label="Amount (XLM)"
                data-testid="amount-input"
              />
              {balance !== null && (mode === 'burn' || balanceProp !== undefined) && (
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
            {exceedsBalance && (
              <p className="feedback error" role="alert" data-testid="exceeds-balance-msg">
                Amount exceeds balance
              </p>
            )}
            <button
              type="submit"
              className={`btn btn-${mode}`}
              disabled={isPending || !isValid}
              data-testid="submit-btn"
            >
              {isPending ? pendingLabel : mode === 'claim' ? 'Claim' : 'Burn'}
            </button>
          </form>
        )}

        {/* Feedback */}
        <div aria-live="polite" aria-atomic="true">
          {phase === 'success' && (
            <div className="feedback success" role="status" data-testid="success-msg">
              <p>XLM {mode === 'claim' ? 'claimed' : 'burned'} successfully!</p>
              {txHash && (
                <p className="tx-hash" data-testid="tx-hash">
                  TX: {txHash.slice(0, 8)}…{txHash.slice(-6)}
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
      </>
    );
  }

  // ─── State → view map ───────────────────────────────────────────────────────

  const stateMap: Record<WalletStatus, React.ReactNode> = {
    checking: renderConnecting(),
    notInstalled: renderNotInstalled(),
    disconnected: renderDisconnected(),
    connecting: renderConnecting(),
    wrongNetwork: renderWrongNetwork(),
    connected: renderForm(),
    error: renderError(),
  };

  return (
    <div className="claim-burn" data-testid="claim-burn">
      <h2 className="claim-burn-title">Claim &amp; Burn</h2>
      {stateMap[status]}
    </div>
  );
}

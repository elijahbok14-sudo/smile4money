import React, { useState } from 'react';
import '../styles/claim-burn.css';

type Mode = 'claim' | 'burn';
type Status = 'idle' | 'confirm' | 'pending' | 'success' | 'error';

interface ClaimBurnProps {
  walletState: 'checking' | 'notInstalled' | 'disconnected' | 'connecting' | 'connected' | 'wrongNetwork';
  onConnect?: () => void;
  onClaim?: (amount: string) => Promise<string | void>;
  onBurn?: (amount: string) => Promise<string | void>;
  onSwitchNetwork?: () => void;
  publicKey?: string | null;
  expectedNetwork?: string;
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

  function resetFeedback() {
    setStatus('idle');
    setTxHash(null);
    setErrorMsg('');
  }

  function handleToggle(newMode: Mode) {
    setMode(newMode);
    resetFeedback();
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
    resetFeedback();
  }

  function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setStatus('confirm');
  }

  async function handleConfirm() {
    setStatus('pending');
    setErrorMsg('');
    setTxHash(null);
    try {
      let hash: string | void;
      if (mode === 'claim') {
        hash = await onClaim?.(amount);
      } else {
        hash = await onBurn?.(amount);
      }
      if (hash) setTxHash(hash);
      setStatus('success');
      setAmount('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
    }
  }

  function handleCancel() {
    resetFeedback();
  }

  function renderNotInstalled() {
    return (
      <div className="wallet-state" data-testid="wallet-not-installed">
        <div className="wallet-state-icon">&#9888;&#65039;</div>
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
        <div className="wallet-state-icon">&#128188;</div>
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
        <p className="wallet-state-message">Connecting to Freighter&hellip;</p>
      </div>
    );
  }

  function renderWrongNetwork() {
    return (
      <div className="wallet-state" data-testid="wallet-wrong-network">
        <div className="wallet-state-icon">&#127760;</div>
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

  function renderForm() {
    return (
      <>
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

        {publicKey && (
          <div className="wallet-info" data-testid="wallet-info">
            <span className="wallet-info-label">Connected</span>
            <span className="wallet-info-address">
              {publicKey.slice(0, 4)}&hellip;{publicKey.slice(-4)}
            </span>
          </div>
        )}

        {status === 'confirm' ? (
          <div className="confirm-overlay" data-testid="confirm-overlay">
            <p className="confirm-text">
              {mode === 'claim' ? 'Claim' : 'Burn'} <strong>{amount}</strong> XLM?
            </p>
            <div className="confirm-buttons">
              <button
                className="btn btn-cancel"
                onClick={handleCancel}
                data-testid="cancel-btn"
              >
                Cancel
              </button>
              <button
                className={`btn btn-${mode}`}
                onClick={handleConfirm}
                data-testid="confirm-btn"
              >
                Confirm
              </button>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleRequestSubmit} data-testid="claim-burn-form">
              <label htmlFor="amount">
                {mode === 'claim' ? 'Claim amount' : 'Burn amount'} (XLM)
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
                disabled={status === 'pending' || !amount || Number(amount) <= 0}
                data-testid="submit-btn"
              >
                {status === 'pending' ? 'Processing\u2026' : mode === 'claim' ? 'Claim' : 'Burn'}
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
          </>
        )}
      </>
    );
  }

  const stateMap: Record<string, React.ReactNode> = {
    checking: renderConnecting(),
    notInstalled: renderNotInstalled(),
    disconnected: renderDisconnected(),
    connecting: renderConnecting(),
    wrongNetwork: renderWrongNetwork(),
    connected: renderForm(),
  };

  return (
    <div className="claim-burn" data-testid="claim-burn">
      <h2 className="claim-burn-title">Claim &amp; Burn</h2>
      {stateMap[walletState]}
    </div>
  );
}

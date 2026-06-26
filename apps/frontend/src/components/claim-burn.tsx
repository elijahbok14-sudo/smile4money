import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    if (!isValidAmount(amount)) return;
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

  // ── Wallet state screens ──────────────────────────────────────────

  if (walletState === 'checking' || walletState === 'connecting') {
    return (
      <div className="dark:bg-slate-900 flex flex-col items-center justify-center rounded-xl bg-slate-50 p-10 text-center" data-testid="wallet-connecting">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600 dark:border-slate-700 dark:border-t-violet-400" />
        <p className="dark:text-slate-400 text-sm text-slate-500">Connecting to wallet&hellip;</p>
      </div>
    );
  }

  if (walletState === 'notInstalled') {
    return (
      <div className="dark:bg-slate-900 flex flex-col items-center justify-center rounded-xl bg-slate-50 p-10 text-center" data-testid="wallet-not-installed">
        <span className="mb-4 text-4xl">⚠️</span>
        <h3 className="dark:text-slate-100 mb-2 text-lg font-semibold text-slate-900">Freighter Not Found</h3>
        <p className="dark:text-slate-400 mb-4 text-sm text-slate-500">
          Please install the{' '}
          <a
            href="https://freighter.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 underline hover:no-underline dark:text-violet-400"
          >
            Freighter wallet extension
          </a>{' '}
          to continue.
        </p>
      </div>
    );
  }

  if (walletState === 'disconnected') {
    return (
      <div className="dark:bg-slate-900 flex flex-col items-center justify-center rounded-xl bg-slate-50 p-10 text-center" data-testid="wallet-disconnected">
        <span className="mb-4 text-4xl">💼</span>
        <h3 className="dark:text-slate-100 mb-2 text-lg font-semibold text-slate-900">Connect Your Wallet</h3>
        <p className="dark:text-slate-400 mb-4 text-sm text-slate-500">
          Connect your Freighter wallet to claim rewards or burn tokens.
        </p>
        <button
          type="button"
          onClick={onConnect}
          data-testid="connect-wallet-btn"
          className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-violet-700 hover:to-violet-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (walletState === 'wrongNetwork') {
    return (
      <div className="dark:bg-slate-900 flex flex-col items-center justify-center rounded-xl bg-slate-50 p-10 text-center" data-testid="wallet-wrong-network">
        <span className="mb-4 text-4xl">🌐</span>
        <h3 className="dark:text-slate-100 mb-2 text-lg font-semibold text-slate-900">Wrong Network</h3>
        <p className="dark:text-slate-400 mb-4 text-sm text-slate-500">
          Please switch your Freighter wallet to{' '}
          <strong className="dark:text-slate-200 text-slate-700">{expectedNetwork}</strong>.
        </p>
        <button
          type="button"
          onClick={onSwitchNetwork}
          data-testid="switch-network-btn"
          className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-violet-700 hover:to-violet-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          Switch to {expectedNetwork}
        </button>
      </div>
    );
  }

  if (walletState === 'error') {
    return (
      <div className="dark:bg-slate-900 flex flex-col items-center justify-center rounded-xl bg-slate-50 p-10 text-center" data-testid="wallet-error">
        <span className="mb-4 text-4xl">⚠️</span>
        <h3 className="dark:text-slate-100 mb-2 text-lg font-semibold text-slate-900">Connection Error</h3>
        <p className="dark:text-slate-400 mb-4 text-sm text-slate-500">
          An error occurred while connecting to your wallet.
        </p>
        <button
          type="button"
          onClick={onConnect}
          data-testid="retry-connect-btn"
          className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-violet-700 hover:to-violet-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Connected UI ──────────────────────────────────────────────────

  const isPending = status === 'pending';
  const showConfirm = status === 'confirm';
  const valid = isValidAmount(amount);

  return (
    <div className="dark:bg-slate-900 dark:border-slate-700 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="claim-burn">
      <h2 className="dark:text-slate-100 mb-5 text-center text-xl font-semibold text-slate-900">Claim &amp; Burn</h2>

      {/* Mode toggle */}
      <div className="dark:bg-slate-800 mb-5 flex rounded-lg bg-slate-100 p-1" role="group" aria-label="Select mode">
        <button
          type="button"
          onClick={() => handleToggle('claim')}
          aria-pressed={mode === 'claim'}
          data-testid="toggle-claim"
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            mode === 'claim'
              ? 'bg-white text-violet-700 shadow-sm dark:bg-slate-700 dark:text-violet-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Claim
        </button>
        <button
          type="button"
          onClick={() => handleToggle('burn')}
          aria-pressed={mode === 'burn'}
          data-testid="toggle-burn"
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            mode === 'burn'
              ? 'bg-white text-violet-700 shadow-sm dark:bg-slate-700 dark:text-violet-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Burn
        </button>
      </div>

      {/* Wallet info */}
      {publicKey && (
        <div className="dark:bg-slate-800 dark:border-slate-700 mb-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm" data-testid="wallet-info">
          <div className="flex flex-wrap items-center gap-2">
            <span className="dark:text-slate-400 font-medium text-slate-600">Connected</span>
            <span className="dark:text-emerald-400 font-mono text-emerald-700 font-semibold">
              {publicKey.slice(0, 4)}&hellip;{publicKey.slice(-4)}
            </span>
            {onDisconnect && (
              <button
                type="button"
                onClick={onDisconnect}
                data-testid="disconnect-btn"
                className="ml-auto rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                Disconnect
              </button>
            )}
          </div>
          {balance != null && (
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-emerald-200 pt-2 dark:border-emerald-800">
              <span className="dark:text-slate-400 font-medium text-slate-600">Balance</span>
              <span
                className="dark:text-emerald-400 font-mono flex-1 text-emerald-700 font-semibold"
                data-testid="wallet-balance"
                aria-label={`${balance} ${tokenSymbol}`}
              >
                {balance} {tokenSymbol}
              </span>
              {onRefreshBalance && (
                <button
                  type="button"
                  onClick={onRefreshBalance}
                  data-testid="refresh-balance-btn"
                  aria-label="Refresh balance"
                  className="rounded-md border border-slate-300 bg-white p-1 text-slate-500 transition-colors hover:text-violet-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 dark:hover:text-violet-400"
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
          className="dark:bg-slate-800 dark:border-slate-700 mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-center"
          data-testid="confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Confirm ${mode}`}
        >
          <p className="dark:text-slate-100 mb-4 text-base font-semibold text-slate-900">
            {mode === 'claim' ? 'Claim' : 'Burn'} <strong>{amount}</strong> {tokenSymbol}?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCancel}
              data-testid="cancel-btn"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              ref={confirmBtnRef}
              type="button"
              onClick={handleConfirm}
              data-testid="confirm-btn"
              disabled={isPending}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                mode === 'claim'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:shadow'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow'
              }`}
            >
              {isPending ? 'Processing…' : 'Confirm'}
            </button>
          </div>
        </div>
      )}

      {/* Amount form */}
      <form onSubmit={handleRequestSubmit} data-testid="claim-burn-form" aria-label={`${mode === 'claim' ? 'Claim' : 'Burn'} tokens`}>
        <div className="mb-1 flex flex-col gap-1.5">
          <label htmlFor="amount-input" className="dark:text-slate-300 text-sm font-medium text-slate-700">
            Amount ({tokenSymbol})
          </label>
          <div className="flex gap-2">
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
              className={`dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-violet-500 dark:focus:ring-violet-500/20 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60`}
            />
            {balance != null && (
              <button
                type="button"
                onClick={handleMax}
                disabled={isPending}
                data-testid="max-btn"
                aria-label="Use maximum balance"
                className="dark:bg-slate-800 dark:border-slate-600 dark:text-violet-400 dark:hover:bg-slate-700 shrink-0 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-violet-600 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Max
              </button>
            )}
          </div>
          {amount !== '' && !valid && (
            <p className="text-sm text-red-600 dark:text-red-400" data-testid="amount-error">
              Please enter a valid positive amount
            </p>
          )}
        </div>

        {!showConfirm && (
          <button
            type="submit"
            disabled={isPending || !valid}
            data-testid="submit-btn"
            aria-busy={isPending}
            className={`mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              mode === 'claim'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-md'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-md'
            }`}
          >
            {isPending ? (mode === 'claim' ? 'Claiming…' : 'Burning…') : (mode === 'claim' ? 'Claim' : 'Burn')}
          </button>
        )}
      </form>

      {/* Feedback */}
      {status === 'success' && (
        <p className="dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-800" role="status" data-testid="success-msg">
          {mode === 'claim'
            ? `${tokenSymbol} claimed successfully!`
            : `${tokenSymbol} burned successfully!`}
          {txHash && (
            <span className="dark:text-violet-400 mt-2 block break-all font-mono text-xs text-violet-600" data-testid="tx-hash">
              {txHash.slice(0, 8)}…{txHash.slice(-8)}
            </span>
          )}
        </p>
      )}
      {status === 'error' && (
        <p className="dark:border-red-800 dark:bg-red-900/30 dark:text-red-400 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-800" role="alert" data-testid="error-msg">
          {errorMsg}
        </p>
      )}
    </div>
  );
}

export default ClaimBurn;

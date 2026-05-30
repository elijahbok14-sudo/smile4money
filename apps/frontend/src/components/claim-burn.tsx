'use client'

import { useState } from 'react'

type Mode = 'claim' | 'burn'
type WalletState = 'disconnected' | 'connecting' | 'connected'

interface ClaimBurnProps {
  /** Token symbol shown in the UI, e.g. "XLM" */
  tokenSymbol?: string
  /** Available balance when wallet is connected */
  balance?: string
}

export function ClaimBurn({ tokenSymbol = 'XLM', balance = '0.00' }: ClaimBurnProps) {
  const [mode, setMode] = useState<Mode>('claim')
  const [walletState, setWalletState] = useState<WalletState>('disconnected')
  const [amount, setAmount] = useState('')
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')

  async function connectWallet() {
    setWalletState('connecting')
    // Simulate wallet handshake — replace with real Freighter/Albedo SDK call
    await new Promise((r) => setTimeout(r, 1000))
    setWalletState('connected')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    setTxStatus('pending')
    // Simulate on-chain tx — replace with Soroban contract call
    await new Promise((r) => setTimeout(r, 1500))
    setTxStatus('success')
    setAmount('')
    setTimeout(() => setTxStatus('idle'), 3000)
  }

  const isBurn = mode === 'burn'

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl bg-gray-900 border border-gray-800 shadow-xl overflow-hidden">
      {/* Toggle */}
      <div className="flex">
        <button
          onClick={() => { setMode('claim'); setTxStatus('idle') }}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            !isBurn
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Claim
        </button>
        <button
          onClick={() => { setMode('burn'); setTxStatus('idle') }}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            isBurn
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Burn
        </button>
      </div>

      <div className="p-6 space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold">
            {isBurn ? `Burn ${tokenSymbol}` : `Claim ${tokenSymbol}`}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isBurn
              ? 'Permanently remove tokens from circulation.'
              : 'Claim your winnings from the escrow contract.'}
          </p>
        </div>

        {/* Wallet disconnected */}
        {walletState === 'disconnected' && (
          <button
            onClick={connectWallet}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors"
          >
            Connect Wallet
          </button>
        )}

        {/* Wallet connecting */}
        {walletState === 'connecting' && (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-400">
            <span className="h-4 w-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
            Connecting…
          </div>
        )}

        {/* Wallet connected */}
        {walletState === 'connected' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Balance */}
            <div className="flex justify-between text-xs text-gray-400">
              <span>Available</span>
              <span className="font-mono text-white">
                {balance} {tokenSymbol}
              </span>
            </div>

            {/* Amount input */}
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pr-16 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">
                {tokenSymbol}
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={txStatus === 'pending' || !amount}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isBurn
                  ? 'bg-red-600 hover:bg-red-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {txStatus === 'pending' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  {isBurn ? 'Burning…' : 'Claiming…'}
                </span>
              ) : isBurn ? (
                'Burn Tokens'
              ) : (
                'Claim Winnings'
              )}
            </button>
          </form>
        )}

        {/* Tx feedback */}
        {txStatus === 'success' && (
          <div className="rounded-xl bg-emerald-900/40 border border-emerald-700 px-4 py-3 text-sm text-emerald-300">
            ✓ Transaction submitted successfully.
          </div>
        )}
        {txStatus === 'error' && (
          <div className="rounded-xl bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
            ✗ Transaction failed. Please try again.
          </div>
        )}
      </div>
    </div>
  )
}

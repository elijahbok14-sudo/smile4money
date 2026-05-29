import { useState, useCallback } from 'react';
import type { WalletStatus } from '../types';

declare global {
  interface Window {
    stellar?: {
      freighter?: {
        isConnected: () => Promise<{ isConnected: boolean }>;
        getPublicKey: () => Promise<string>;
        signTransaction: (xdr: string) => Promise<{ signedTxXdr: string }>;
      };
    };
  }
}

interface StellarWallet {
  status: WalletStatus;
  address: string | null;
  error: string | null;
  balance: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useStellarWallet(): StellarWallet {
  const [status, setStatus] = useState<WalletStatus>('disconnected');
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balance] = useState<string | null>(null);

  const connect = useCallback(async () => {
    const freighter = window.stellar?.freighter;
    if (!freighter) {
      setStatus('error');
      setError('Freighter wallet not detected. Please install the Freighter browser extension.');
      return;
    }

    setStatus('connecting');
    setError(null);

    try {
      const { isConnected } = await freighter.isConnected();
      if (!isConnected) {
        setStatus('disconnected');
        return;
      }

      const publicKey = await freighter.getPublicKey();
      setAddress(publicKey);
      setStatus('connected');
    } catch (err) {
      setStatus('error');
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to connect to Freighter wallet',
      );
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setStatus('disconnected');
    setError(null);
  }, []);

  return { status, address, error, balance, connect, disconnect };
}

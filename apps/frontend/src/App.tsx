import { ClaimBurn } from './components/claim-burn';
import { NetworkBadge } from './components/NetworkBadge';
import { useStellarWallet } from './hooks/useStellarWallet';
import { useTheme } from './hooks/useTheme';
import type { WalletStatus } from './types';

export function App() {
  const { status, address, balance, network, connect, disconnect, refreshBalance } = useStellarWallet();
  const { theme, toggle } = useTheme();

  const walletState = (
    status === 'connected' && network !== 'unknown' && network !== 'testnet'
      ? 'wrongNetwork'
      : status
  ) as WalletStatus;

  const handleClaim = async (amount: string): Promise<string | void> => {
    // TODO: submit claim transaction via Stellar SDK
    console.info('Claim request', amount);
  };

  const handleBurn = async (amount: string): Promise<string | void> => {
    // TODO: submit burn transaction via Stellar SDK
    console.info('Burn request', amount);
  };

  return (
    <main className="dark:bg-slate-950 dark:text-slate-100 min-h-screen bg-gray-100 px-4 py-6 text-slate-900 transition-colors">
      <div className="mx-auto mb-4 flex max-w-2xl items-center justify-between">
        <NetworkBadge />
        <button
          type="button"
          onClick={toggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
      <ClaimBurn
        walletState={walletState}
        onConnect={connect}
        onDisconnect={disconnect}
        onRefreshBalance={refreshBalance}
        onClaim={handleClaim}
        onBurn={handleBurn}
        publicKey={address}
        balance={balance}
        expectedNetwork="testnet"
      />
    </main>
  );
}

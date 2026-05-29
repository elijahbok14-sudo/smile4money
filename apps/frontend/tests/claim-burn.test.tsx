import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClaimBurn } from '../src/components/claim-burn';
import type { WalletState } from '../src/types';

function connectedWallet(overrides?: Partial<WalletState>): WalletState {
  return {
    status: 'connected',
    address: 'GA4QZ3R2X3Y6KZ7J8M9N0P1Q2R3S4T5U6V7W8X9Y0Z1',
    error: null,
    balance: null,
    ...overrides,
  };
}

describe('ClaimBurn — wallet states', () => {
  it('shows connect prompt when disconnected', () => {
    render(
      <ClaimBurn
        walletState={{ status: 'disconnected', address: null, error: null, balance: null }}
      />,
    );
    expect(screen.getByTestId('connect-wallet-btn')).toBeInTheDocument();
    expect(screen.getByText(/Connect your Freighter wallet/i)).toBeInTheDocument();
  });

  it('calls onConnect when connect button clicked', () => {
    const onConnect = vi.fn();
    render(
      <ClaimBurn
        walletState={{ status: 'disconnected', address: null, error: null, balance: null }}
        onConnect={onConnect}
      />,
    );
    fireEvent.click(screen.getByTestId('connect-wallet-btn'));
    expect(onConnect).toHaveBeenCalledOnce();
  });

  it('shows connecting state', () => {
    render(
      <ClaimBurn
        walletState={{ status: 'connecting', address: null, error: null, balance: null }}
      />,
    );
    expect(screen.getByTestId('connecting-msg')).toBeInTheDocument();
    expect(screen.getByText(/Connecting to Freighter/i)).toBeInTheDocument();
  });

  it('shows error state with message', () => {
    render(
      <ClaimBurn
        walletState={{
          status: 'error',
          address: null,
          error: 'Freighter not installed',
          balance: null,
        }}
      />,
    );
    expect(screen.getByTestId('wallet-error-msg')).toHaveTextContent('Freighter not installed');
    expect(screen.getByTestId('retry-connect-btn')).toBeInTheDocument();
  });

  it('calls onConnect from error retry button', () => {
    const onConnect = vi.fn();
    render(
      <ClaimBurn
        walletState={{
          status: 'error',
          address: null,
          error: 'Something went wrong',
          balance: null,
        }}
        onConnect={onConnect}
      />,
    );
    fireEvent.click(screen.getByTestId('retry-connect-btn'));
    expect(onConnect).toHaveBeenCalledOnce();
  });

  it('shows form when connected', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    expect(screen.getByTestId('claim-burn-form')).toBeInTheDocument();
  });

  it('shows formatted wallet address', () => {
    render(
      <ClaimBurn
        walletState={connectedWallet({ address: 'GA4QZ3R2X3Y6KZ7J8M9N0P1Q2R3S4T5U6V7W8X9Y0Z1' })}
      />,
    );
    expect(screen.getByTestId('wallet-address')).toHaveTextContent('GA4Q…Y0Z1');
  });

  it('shows disconnect button when onDisconnect provided', () => {
    render(<ClaimBurn walletState={connectedWallet()} onDisconnect={vi.fn()} />);
    expect(screen.getByTestId('disconnect-btn')).toBeInTheDocument();
  });

  it('does not show disconnect button when onDisconnect not provided', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    expect(screen.queryByTestId('disconnect-btn')).not.toBeInTheDocument();
  });

  it('calls onDisconnect when disconnect button clicked', () => {
    const onDisconnect = vi.fn();
    render(<ClaimBurn walletState={connectedWallet()} onDisconnect={onDisconnect} />);
    fireEvent.click(screen.getByTestId('disconnect-btn'));
    expect(onDisconnect).toHaveBeenCalledOnce();
  });
});

describe('ClaimBurn — toggle', () => {
  it('defaults to claim mode', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    expect(screen.getByTestId('toggle-claim')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('toggle-burn')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Claim');
  });

  it('switches to burn mode', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.click(screen.getByTestId('toggle-burn'));
    expect(screen.getByTestId('toggle-burn')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('toggle-claim')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Burn');
  });

  it('resets status when toggling after error', () => {
    const onClaim = vi.fn().mockRejectedValue(new Error('fail'));
    render(<ClaimBurn walletState={connectedWallet()} onClaim={onClaim} />);

    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '5' } });
    fireEvent.click(screen.getByTestId('submit-btn'));

    return waitFor(() => {
      expect(screen.getByTestId('error-msg')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('toggle-burn'));
      expect(screen.queryByTestId('error-msg')).not.toBeInTheDocument();
    });
  });
});

describe('ClaimBurn — submit', () => {
  it('calls onClaim with amount', async () => {
    const onClaim = vi.fn().mockResolvedValue(undefined);
    render(<ClaimBurn walletState={connectedWallet()} onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    await waitFor(() => expect(screen.getByTestId('success-msg')).toBeInTheDocument());
    expect(onClaim).toHaveBeenCalledWith('10');
  });

  it('calls onBurn with amount', async () => {
    const onBurn = vi.fn().mockResolvedValue(undefined);
    render(<ClaimBurn walletState={connectedWallet()} onBurn={onBurn} />);
    fireEvent.click(screen.getByTestId('toggle-burn'));
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '25' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    await waitFor(() => expect(screen.getByTestId('success-msg')).toBeInTheDocument());
    expect(onBurn).toHaveBeenCalledWith('25');
  });

  it('shows error on failure', async () => {
    const onClaim = vi.fn().mockRejectedValue(new Error('Insufficient balance'));
    render(<ClaimBurn walletState={connectedWallet()} onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '5' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    await waitFor(() =>
      expect(screen.getByTestId('error-msg')).toHaveTextContent('Insufficient balance'),
    );
  });

  it('disables submit when amount is empty', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
  });

  it('disables submit when amount is zero', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '0' } });
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
  });

  it('disables submit when amount is negative', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '-5' } });
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
  });

  it('disables input and submit during pending', async () => {
    const onClaim = vi.fn().mockImplementation(() => new Promise<void>(() => {}));
    render(<ClaimBurn walletState={connectedWallet()} onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    expect(screen.getByTestId('amount-input')).toBeDisabled();
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Processing…');
  });

  it('resets status on amount change after success', () => {
    const onClaim = vi.fn().mockResolvedValue(undefined);
    render(<ClaimBurn walletState={connectedWallet()} onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));

    return waitFor(() => {
      expect(screen.getByTestId('success-msg')).toBeInTheDocument();
      fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '20' } });
      expect(screen.queryByTestId('success-msg')).not.toBeInTheDocument();
    });
  });
});

describe('ClaimBurn — balance display', () => {
  it('shows balance when provided', () => {
    render(<ClaimBurn walletState={connectedWallet({ balance: '1000' })} />);
    expect(screen.getByText(/Balance: 1000 XLM/)).toBeInTheDocument();
  });

  it('does not show balance when null', () => {
    render(<ClaimBurn walletState={connectedWallet({ balance: null })} />);
    expect(screen.queryByText(/Balance:/)).not.toBeInTheDocument();
  });
});

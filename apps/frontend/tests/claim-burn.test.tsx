import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClaimBurn } from '../src/components/claim-burn';
import { ToastProvider } from '../src/components/Toast';

// Mock CSS import
vi.mock('../src/styles/claim-burn.css', () => ({}));

function renderWithProviders(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('ClaimBurn — wallet states', () => {
  it('shows checking/connecting spinner while loading', () => {
    renderWithProviders(<ClaimBurn walletState="checking" />);
    expect(screen.getByTestId('wallet-connecting')).toBeInTheDocument();
  });

  it('shows connect prompt when disconnected', () => {
    renderWithProviders(<ClaimBurn walletState="disconnected" />);
    expect(screen.getByTestId('wallet-disconnected')).toBeInTheDocument();
    expect(screen.getByTestId('connect-wallet-btn')).toBeInTheDocument();
  });

  it('calls onConnect when connect button clicked', () => {
    const onConnect = vi.fn();
    renderWithProviders(
      <ClaimBurn
        walletState="disconnected"
        onConnect={onConnect}
      />,
    );
    fireEvent.click(screen.getByTestId('connect-wallet-btn'));
    expect(onConnect).toHaveBeenCalledOnce();
  });

  it('shows connecting state with spinner', () => {
    renderWithProviders(<ClaimBurn walletState="connecting" />);
    expect(screen.getByTestId('wallet-connecting')).toBeInTheDocument();
  });

  it('shows notInstalled state', () => {
    renderWithProviders(<ClaimBurn walletState="notInstalled" />);
    expect(screen.getByTestId('wallet-not-installed')).toBeInTheDocument();
  });

  it('shows wrongNetwork state', () => {
    renderWithProviders(<ClaimBurn walletState="wrongNetwork" expectedNetwork="testnet" />);
    expect(screen.getByTestId('wallet-wrong-network')).toBeInTheDocument();
    expect(screen.getByTestId('switch-network-btn')).toBeInTheDocument();
  });

  it('calls onSwitchNetwork when switch network button clicked', () => {
    const onSwitchNetwork = vi.fn();
    renderWithProviders(<ClaimBurn walletState="wrongNetwork" onSwitchNetwork={onSwitchNetwork} />);
    fireEvent.click(screen.getByTestId('switch-network-btn'));
    expect(onSwitchNetwork).toHaveBeenCalledOnce();
  });

  it('shows form when connected', () => {
    renderWithProviders(<ClaimBurn walletState="connected" />);
    expect(screen.getByTestId('claim-burn-form')).toBeInTheDocument();
  });

  it('shows wallet info when publicKey provided', () => {
    renderWithProviders(<ClaimBurn walletState="connected" publicKey="GABCDEF1234567890XYZ" />);
    expect(screen.getByTestId('wallet-info')).toBeInTheDocument();
  });
});

describe('ClaimBurn — toggle', () => {
  it('defaults to claim mode', () => {
    renderWithProviders(<ClaimBurn walletState="connected" />);
    expect(screen.getByTestId('toggle-claim')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('toggle-burn')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Claim');
  });

  it('switches to burn mode', () => {
    renderWithProviders(<ClaimBurn walletState="connected" />);
    fireEvent.click(screen.getByTestId('toggle-burn'));
    expect(screen.getByTestId('toggle-burn')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('toggle-claim')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Burn');
  });

  it('switches back to claim mode', () => {
    renderWithProviders(<ClaimBurn walletState="connected" />);
    fireEvent.click(screen.getByTestId('toggle-burn'));
    fireEvent.click(screen.getByTestId('toggle-claim'));
    expect(screen.getByTestId('toggle-claim')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Claim');
  });
});

describe('ClaimBurn — confirmation flow', () => {
  it('shows confirmation overlay after clicking submit', () => {
    renderWithProviders(<ClaimBurn walletState="connected" />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    expect(screen.getByTestId('confirm-overlay')).toBeInTheDocument();
  });

  it('hides submit button when showing confirmation', () => {
    renderWithProviders(<ClaimBurn walletState="connected" />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    expect(screen.queryByTestId('submit-btn')).not.toBeInTheDocument();
  });

  it('cancels confirmation and shows submit button again', () => {
    renderWithProviders(<ClaimBurn walletState="connected" />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('cancel-btn'));
    expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('confirm-overlay')).not.toBeInTheDocument();
  });

  it('shows amount in confirmation text', () => {
    renderWithProviders(<ClaimBurn walletState="connected" />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '42.5' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    expect(screen.getByTestId('confirm-overlay')).toHaveTextContent('42.5');
  });
});

describe('ClaimBurn — submit and error handling', () => {
  it('calls onClaim with amount after confirmation', async () => {
    const onClaim = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<ClaimBurn walletState="connected" onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() => expect(screen.getByTestId('success-msg')).toBeInTheDocument());
    expect(onClaim).toHaveBeenCalledWith('10');
  });

  it('calls onBurn with amount', async () => {
    const onBurn = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<ClaimBurn walletState="connected" onBurn={onBurn} />);
    fireEvent.click(screen.getByTestId('toggle-burn'));
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '5' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() => expect(screen.getByTestId('success-msg')).toBeInTheDocument());
    expect(onBurn).toHaveBeenCalledWith('5');
  });

  it('shows error on failure', async () => {
    const onClaim = vi.fn().mockRejectedValue(new Error('Transaction failed'));
    renderWithProviders(<ClaimBurn walletState="connected" onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() => expect(screen.getByTestId('error-msg')).toBeInTheDocument());
    expect(screen.getByTestId('error-msg')).toHaveTextContent('Transaction failed');
  });

  it('resets status on amount change after error', async () => {
    const onClaim = vi.fn().mockRejectedValue(new Error('Transaction failed'));
    renderWithProviders(<ClaimBurn walletState="connected" onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() => expect(screen.getByTestId('error-msg')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '20' } });
    expect(screen.queryByTestId('error-msg')).not.toBeInTheDocument();
  });

  it('disables submit when amount is empty', () => {
    renderWithProviders(<ClaimBurn walletState="connected" />);
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
  });

  it('disables submit when amount is zero', () => {
    renderWithProviders(<ClaimBurn walletState="connected" />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '0' } });
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
  });
});

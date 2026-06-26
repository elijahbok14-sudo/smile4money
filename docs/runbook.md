# Operational Runbook — smile4money

> **Audience:** On-call engineers and administrators with access to the admin private key.
> **Scope:** Emergency response, oracle key rotation, and post-incident analysis.

---

## Table of Contents

1. [Emergency Contract Pause](#1-emergency-contract-pause)
2. [Oracle Signing Key Rotation](#2-oracle-signing-key-rotation)
3. [Emergency Fund Drain](#3-emergency-fund-drain)
4. [Unpausing the Contract](#4-unpausing-the-contract)
5. [Post-Incident Report Template](#5-post-incident-report-template)
6. [Contact Escalation List](#6-contact-escalation-list)

---

## 1. Emergency Contract Pause

**When to use:** Suspected exploit, incorrect payout, oracle compromise, or any situation where
halting new activity is safer than continuing operations.

**Who can pause:** Only the `admin` address set during `initialize`.

**Effect:** Blocks `create_match`, `deposit`, and `submit_result`. `cancel_match` remains
available so players can always recover their funds.

### Steps

#### 1.1 Confirm the admin identity

```bash
# Verify your local key matches the on-chain admin
stellar keys address admin-key
# Compare output against the CONTRACT_ADMIN value in your .env
```

#### 1.2 Pause the escrow contract

```bash
stellar contract invoke \
  --id "$CONTRACT_ESCROW" \
  --source admin-key \
  --network testnet \
  -- pause
```

For **mainnet**, replace `--network testnet` with `--network mainnet`.

#### 1.3 Verify the pause is in effect

```bash
# This call should return an error: Error::ContractPaused (code 9)
stellar contract invoke \
  --id "$CONTRACT_ESCROW" \
  --source any-key \
  --network testnet \
  -- create_match \
  --player1 GDUMMY1 \
  --player2 GDUMMY2 \
  --stake_amount 1 \
  --token GDUMMY3 \
  --game_id test \
  --platform '{"Lichess":{}}'
# Expected output: error code 9 (ContractPaused)
```

Alternatively, query the `Paused` instance storage key using Stellar's RPC:

```bash
curl -s "https://soroban-testnet.stellar.org" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,
    "method":"getLedgerEntries",
    "params":{"keys":["<PAUSED_LEDGER_KEY_XDR>"]}
  }'
```

#### 1.4 Notify the team

Post to the incident channel immediately:

```
[INCIDENT] Escrow contract PAUSED at ledger <N> by <admin-address>.
Reason: <brief description>
Next action: <investigation / drain / oracle rotation>
```

---

## 2. Oracle Signing Key Rotation

**When to use:** Oracle private key is compromised, exposed in logs, or as a scheduled rotation.

**Who can rotate:** Only the `admin` address.

### Steps

#### 2.1 Generate a new oracle keypair

```bash
stellar keys generate new-oracle-key --network testnet
stellar keys address new-oracle-key
# Save the output address as NEW_ORACLE_ADDRESS
```

For mainnet, **generate the keypair offline** on an air-gapped machine and import the public
address only:

```bash
# On air-gapped machine
stellar keys generate new-oracle-key
stellar keys address new-oracle-key   # copy this address

# On connected machine — fund the new account
stellar account fund --address <NEW_ORACLE_ADDRESS> --network testnet
```

#### 2.2 Fund the new oracle account (testnet)

```bash
stellar account fund --address "$NEW_ORACLE_ADDRESS" --network testnet
```

#### 2.3 Call `update_oracle` on the escrow contract

```bash
stellar contract invoke \
  --id "$CONTRACT_ESCROW" \
  --source admin-key \
  --network testnet \
  -- update_oracle \
  --new_oracle "$NEW_ORACLE_ADDRESS"
```

#### 2.4 Call `transfer_admin` on the oracle contract

The oracle **contract** also has its own admin (the off-chain service key). Rotate it too:

```bash
stellar contract invoke \
  --id "$CONTRACT_ORACLE" \
  --source old-oracle-key \
  --network testnet \
  -- transfer_admin \
  --new_admin "$NEW_ORACLE_ADDRESS"
```

#### 2.5 Verify the new oracle is registered

```bash
# Submit a test result with the new key (use a safe test match_id on testnet)
stellar contract invoke \
  --id "$CONTRACT_ORACLE" \
  --source new-oracle-key \
  --network testnet \
  -- submit_result \
  --match_id 0 \
  --game_id "rotation-verify-test" \
  --result '{"Player1Wins":{}}'
```

Expected: success (or `AlreadySubmitted` if a result already exists — both confirm auth works).

#### 2.6 Update the oracle service configuration

```bash
# In the oracle service deployment (e.g., systemd, Docker, or cloud secret store):
# Replace ORACLE_SIGNING_KEY with the new key
# Restart the oracle service and confirm it re-connects successfully
systemctl restart smile4money-oracle   # or equivalent
journalctl -u smile4money-oracle -f    # watch for errors
```

#### 2.7 Revoke and destroy the old key

- Remove the old key from all `.env` files and secret stores.
- If using a hardware wallet, revoke the signing slot.
- Document the rotation in the incident log.

---

## 3. Emergency Fund Drain

**When to use:** Active exploit with no time for match-by-match resolution. Transfers the
entire contract token balance to a safe cold-wallet address.

> ⚠️ **This is irreversible.** All in-progress matches will lose their escrowed funds.
> Use only when the alternative is losing more funds to an exploit.

### Prerequisites

- Contract must be **paused** (see §1).
- A **safe cold-wallet address** (`SAFE_ADDRESS`) that is NOT the admin hot wallet.

### Steps

#### 3.1 Confirm the contract is paused (see §1.3)

#### 3.2 Execute the drain

```bash
stellar contract invoke \
  --id "$CONTRACT_ESCROW" \
  --source admin-key \
  --network testnet \
  -- emergency_drain \
  --to "$SAFE_ADDRESS" \
  --caller "$ADMIN_ADDRESS"
```

#### 3.3 Confirm balance is zero

```bash
stellar contract invoke \
  --id "$CONTRACT_ESCROW" \
  --source any-key \
  --network testnet \
  -- get_escrow_balance \
  --match_id 0
# Should return 0 for all match IDs
```

Check the contract's raw token balance:

```bash
stellar contract invoke \
  --id "$TOKEN_ADDRESS" \
  --source any-key \
  --network testnet \
  -- balance \
  --id "$CONTRACT_ESCROW"
# Expected: 0
```

#### 3.4 Record the drain transaction hash and notify all stakeholders

---

## 4. Unpausing the Contract

Only unpause after the incident is fully resolved and the root cause has been addressed.

### Checklist before unpausing

- [ ] Root cause identified and fixed (contract upgrade or oracle key rotated)
- [ ] All affected matches manually reconciled (refunds issued if needed)
- [ ] At least one other team member has reviewed and signed off
- [ ] Incident report drafted (see §5)

### Command

```bash
stellar contract invoke \
  --id "$CONTRACT_ESCROW" \
  --source admin-key \
  --network testnet \
  -- unpause
```

### Verify

```bash
# Should succeed and return a match_id
stellar contract invoke \
  --id "$CONTRACT_ESCROW" \
  --source player1-key \
  --network testnet \
  -- create_match \
  --player1 "$PLAYER1_ADDRESS" \
  --player2 "$PLAYER2_ADDRESS" \
  --stake_amount 10000000 \
  --token "$TOKEN_ADDRESS" \
  --game_id "post-incident-verify" \
  --platform '{"Lichess":{}}'
```

---

## 5. Post-Incident Report Template

Copy this template and fill it in for every incident, regardless of severity.

---

### Incident Report — [YYYY-MM-DD] [Brief Title]

**Severity:** Critical / High / Medium / Low
**Status:** Open / Resolved
**Report Author:** [Name / GitHub handle]
**Reviewed by:** [Name / GitHub handle]

#### Timeline

| Time (UTC) | Event |
|------------|-------|
| HH:MM | Incident detected (how: alert / user report / monitoring) |
| HH:MM | On-call engineer paged |
| HH:MM | Contract paused at ledger N (tx hash: `...`) |
| HH:MM | Root cause identified |
| HH:MM | Fix deployed / oracle rotated |
| HH:MM | Contract unpaused at ledger N (tx hash: `...`) |
| HH:MM | Incident resolved |

#### Impact

- **Users affected:** [number / description]
- **Funds at risk:** [amount in XLM/USDC]
- **Funds lost:** [amount, or "none"]
- **Matches disrupted:** [match IDs]
- **Duration of outage:** [HH:MM]

#### Root Cause

[One paragraph describing what went wrong, why it happened, and what allowed it to occur.]

#### What Went Well

- [Item 1]
- [Item 2]

#### What Went Poorly

- [Item 1]
- [Item 2]

#### Remediation

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| [Fix description] | [Name] | YYYY-MM-DD | Open |
| [Monitoring improvement] | [Name] | YYYY-MM-DD | Open |
| [Runbook update] | [Name] | YYYY-MM-DD | Open |

#### Sign-off

- [ ] Incident lead reviewed
- [ ] Second team member reviewed
- [ ] Remediation items tracked in GitHub Issues

---

## 6. Contact Escalation List

> Replace placeholder entries with real contact information before deploying to mainnet.

| Role | Contact | How to reach |
|------|---------|--------------|
| On-call engineer (primary) | [Name] | PagerDuty / Signal |
| On-call engineer (backup) | [Name] | PagerDuty / Signal |
| Contract admin keyholder | [Name] | End-to-end encrypted message only |
| Oracle service owner | [Name] | Slack `#oracle-ops` |
| Stellar network status | SDF | https://status.stellar.org |
| Lichess API status | Lichess | https://lichess.org/status |
| Chess.com API status | Chess.com | https://www.chess.com/news |

### Escalation path

1. On-call primary — immediate (0–15 min)
2. On-call backup — if primary unreachable (15–30 min)
3. Contract admin keyholder — required for pause/drain/oracle rotation
4. All team leads — severity Critical only

---

*This runbook is a living document. Update it whenever a procedure changes or a gap is discovered
during an incident. The reviewing engineer is responsible for merging updates.*

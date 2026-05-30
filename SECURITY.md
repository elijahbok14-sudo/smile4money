# Security Policy

## Responsible Disclosure

If you discover a security vulnerability, **do not open a public GitHub issue**.

1. Open a GitHub issue with the label `security` and a brief, non-revealing title.
2. Contact the maintainers directly (via the email in the GitHub profile) with full details.
3. Allow up to 14 days for an initial response and 90 days for a fix before public disclosure.

We will credit researchers who report valid vulnerabilities.

---

## Threat Model

### Trust Assumptions

| Actor | Trusted for | Not trusted for |
|-------|-------------|-----------------|
| Stellar network | Correct Soroban contract execution | — |
| Oracle service | Accurate game result reporting | Custody of player funds |
| Admin key | Pause/unpause, oracle rotation | Accessing escrowed funds |
| Players | Their own key management | Each other |

No single party can unilaterally steal funds. All payout rules are enforced on-chain.

### Attack Vectors

#### Re-initialization
**Threat**: Attacker calls `initialize` a second time to overwrite oracle/admin.  
**Mitigation**: Both contracts check storage for an existing `Oracle` key and panic on a second call.

#### Oracle Substitution
**Threat**: Attacker replaces the oracle address to redirect payouts.  
**Mitigation**: Oracle address can only be rotated by the admin via `update_oracle`.

#### Unauthorized Result Submission
**Threat**: Non-oracle address calls `submit_result`.  
**Mitigation**: `submit_result` compares `caller` against the stored oracle address and returns `Error::Unauthorized` before any state change.

#### Double Result Submission
**Threat**: Oracle submits a result twice to change the winner.  
**Mitigation**: Match state is checked for `Active` before processing; `Completed` is terminal. Oracle contract additionally rejects duplicates with `Error::AlreadySubmitted`.

#### Cross-Match Result Injection
**Threat**: Compromised oracle submits a result for the correct `match_id` but a different `game_id`.  
**Mitigation**: `submit_result` validates `game_id` against the value stored at match creation. Mismatch returns `Error::GameIdMismatch`.

#### Duplicate Game ID
**Threat**: Multiple matches reference the same chess `game_id`; one oracle result pays out all of them.  
**Mitigation**: `create_match` stores each `game_id` in persistent storage and returns `Error::DuplicateGameId` on collision.

#### Deposit into Inactive Match
**Threat**: Player deposits into a cancelled or completed match, locking funds.  
**Mitigation**: `deposit` requires `state == Pending`; any other state returns `Error::InvalidState`.

#### Zero-Stake Match
**Threat**: Match created with `stake_amount = 0` wastes ledger storage.  
**Mitigation**: `create_match` returns `Error::InvalidAmount` if `stake_amount <= 0`.

#### Self-Match
**Threat**: Single address creates a match against itself.  
**Mitigation**: `create_match` checks `player1 != player2` and returns `Error::InvalidPlayers`.

#### Integer Overflow in Match Counter
**Threat**: `MatchCount` wraps silently, reusing match IDs.  
**Mitigation**: `create_match` uses `checked_add(1).ok_or(Error::Overflow)?`.

#### Storage Expiry
**Threat**: A persistent `Match` entry expires mid-game.  
**Mitigation**: Every persistent write calls `extend_ttl` with `MATCH_TTL_LEDGERS` (~30 days).

#### No Emergency Stop
**Threat**: Critical bug discovered post-deployment with no way to halt damage.  
**Mitigation**: Admin can call `pause()` to block `create_match`, `deposit`, and `submit_result`. `cancel_match` remains available so players can recover funds.

---

## Access Control Summary

| Function | Caller |
|----------|--------|
| `initialize` | Anyone (once only) |
| `create_match` | `player1` (requires auth) |
| `deposit` | `player1` or `player2` (requires auth) |
| `cancel_match` | `player1` or `player2` (requires auth) |
| `submit_result` | Registered oracle only |
| `pause` / `unpause` | Admin only |
| `update_oracle` | Admin only |
| `get_match` / `is_funded` / `get_escrow_balance` | Anyone (read-only) |

---

## Audit Checklist

### Authentication & Authorization
- [ ] All state-mutating functions require `require_auth()` from the appropriate caller
- [ ] Oracle address is validated before any payout is executed
- [ ] Admin-only functions reject non-admin callers before any storage write

### State Machine Integrity
- [ ] All state transitions are guarded; invalid transitions return `Error::InvalidState`
- [ ] `Completed` and `Cancelled` are terminal — no further transitions possible
- [ ] `deposit` is rejected on non-`Pending` matches

### Fund Safety
- [ ] Payout amounts are exactly `stake_amount * 2` (winner) or `stake_amount` each (draw)
- [ ] `cancel_match` refunds only deposited players; non-depositors receive nothing
- [ ] No code path allows funds to be sent to an address other than `player1`, `player2`, or back to depositor
- [ ] `get_escrow_balance` returns 0 for `Completed` and `Cancelled` matches

### Input Validation
- [ ] `stake_amount <= 0` is rejected
- [ ] `player1 == player2` is rejected
- [ ] `game_id` length is bounded by `MAX_GAME_ID_LEN`
- [ ] Duplicate `game_id` across matches is rejected

### Oracle Security
- [ ] `game_id` is verified against the stored value on every `submit_result` call
- [ ] Oracle address can only be changed by the admin

### Storage & TTL
- [ ] All persistent entries call `extend_ttl` on every write
- [ ] `MatchCount` increment uses `checked_add` to prevent overflow

### Pause Mechanism
- [ ] `pause()` blocks `create_match`, `deposit`, and `submit_result`
- [ ] `cancel_match` remains callable while paused
- [ ] Only admin can pause/unpause

### Known Limitations
- The oracle is a centralised component; a compromised oracle key can submit incorrect results. Mitigated by `update_oracle` key rotation.
- No automatic timeout for unresolved matches; players must manually cancel to recover funds.

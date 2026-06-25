# Bug: `stake_amount * 2` in `submit_result` can silently overflow i128

**Type:** Bug / Security  
**Priority:** High  
**Difficulty:** Easy  
**Labels:** `bug`, `security`, `smart-contract`, `escrow`  
**File:** `contracts/escrow/src/lib.rs` → `submit_result`

---

## Summary

In `EscrowContract::submit_result`, the payout for a non-draw result is calculated as:

```rust
let payout_amount: i128 = match winner {
    Winner::Draw => m.stake_amount,
    _ => m.stake_amount * 2,   // ← unchecked multiplication
};
```

Soroban contracts compile to WASM with `overflow-checks = false` in release mode, meaning an unchecked `i128` multiplication will **wrap silently** rather than trap. If `stake_amount` is near `i128::MAX / 2` (a value that passes the `> 0` guard in `create_match`), the multiplication overflows to a negative number, causing `token::transfer` to receive a negative amount and either panic or send the wrong value.

---

## Reproduction Steps

1. Deploy the escrow contract on Soroban testnet.
2. Create a match with `stake_amount = i128::MAX / 2 + 1`.
3. Both players call `deposit`.
4. Oracle calls `submit_result` with `Winner::Player1`.
5. `payout_amount = (i128::MAX / 2 + 1) * 2` overflows to a negative value.
6. `client.transfer(…, &payout_amount)` is called with a negative amount.

---

## Expected Behavior

`submit_result` returns `Error::Overflow` (code 8) when `stake_amount * 2` would exceed `i128::MAX`. No token transfer occurs and match state remains `Active` so the situation can be recovered.

---

## Actual Behavior

In release WASM builds (where `overflow-checks` are disabled), the multiplication wraps silently. The contract either panics inside the token transfer (surfacing a confusing host error) or sends an incorrect amount.

---

## Technical Notes

- `i128::MAX` = `170_141_183_460_469_231_731_687_303_715_884_105_727`
- `i128::MAX / 2` = `85_070_591_730_234_615_865_843_651_857_942_052_863`
- Any `stake_amount > i128::MAX / 2` will overflow when doubled
- The existing overflow guard in `create_match` only protects the `MatchCount` counter, not the payout calculation
- `i128::checked_mul` returns `None` on overflow with zero runtime cost in release mode

---

## Acceptance Criteria

- [ ] Replace `m.stake_amount * 2` with `m.stake_amount.checked_mul(2).ok_or(Error::Overflow)?`
- [ ] Add a corresponding unit test in `contracts/escrow/src/tests.rs`:
  ```rust
  #[test]
  fn test_submit_result_overflow_stake_rejected() {
      // stake_amount = i128::MAX / 2 + 1 should fail with Error::Overflow
  }
  ```
- [ ] Verify the test fails before the fix and passes after
- [ ] Add a comment above the calculation explaining the overflow risk

---

## Suggested Implementation

```rust
// In submit_result, replace:
let payout_amount: i128 = match winner {
    Winner::Draw => m.stake_amount,
    _ => m.stake_amount * 2,
};

// With:
let payout_amount: i128 = match winner {
    Winner::Draw => m.stake_amount,
    _ => m.stake_amount.checked_mul(2).ok_or(Error::Overflow)?,
};
```

No other changes are required. The `Error::Overflow` variant (code 8) already exists in `contracts/escrow/src/errors.rs`.

---

## References

- `contracts/escrow/src/lib.rs:258` — current multiplication
- `contracts/escrow/src/errors.rs:38` — `Error::Overflow = 8`
- [Rust reference: integer overflow behaviour](https://doc.rust-lang.org/reference/expressions/operator-expr.html#overflow)
- [Soroban WASM compilation flags](https://soroban.stellar.org/docs/smart-contracts/getting-started/setup)

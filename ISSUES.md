# smile4money — 125 GitHub Issues

> Stack: Rust · Soroban · Stellar · React · TypeScript · Vite · Tailwind · Vitest · GitHub Actions

---

## Smart Contract — Escrow (`contracts/escrow`)

| # | Title | Priority | Difficulty | Tags |
|---|-------|----------|------------|------|
| 1 | Replace `panic!` in `initialize` with `Error::AlreadyInitialized` for consistent error handling | high | easy | bug, smart-contract, escrow |
| 2 | Add `checked_mul` for payout calculation `stake_amount * 2` to prevent i128 overflow | high | easy | bug, security, smart-contract |
| 3 | Emit `match:created` event with `platform` field included in payload | medium | easy | smart-contract, escrow, events |
| 4 | Add minimum stake floor constant (e.g. 1 stroop) and reject amounts below it | medium | easy | smart-contract, escrow, validation |
| 5 | Add maximum stake cap to prevent any single match from holding unbounded funds | medium | easy | security, smart-contract, escrow |
| 6 | Extend instance storage TTL in `initialize` so contract metadata doesn't expire | high | easy | bug, smart-contract, escrow |
| 7 | Add `get_oracle` read-only function for off-chain services to verify oracle address | low | easy | smart-contract, escrow, api |
| 8 | Add `get_admin` read-only function so tooling can confirm admin address without storage inspection | low | easy | smart-contract, escrow, api |
| 9 | Add `get_match_count` read-only function exposing total matches created | low | easy | smart-contract, escrow, api |
| 10 | Add `is_paused` public read-only function so frontend can gate UI before attempting transactions | medium | easy | smart-contract, escrow, api |
| 11 | Validate `token` address in `create_match` matches the initialized default token | medium | easy | security, smart-contract, escrow |
| 12 | Add `transfer_admin` function to escrow contract for admin key rotation without redeployment | high | medium | smart-contract, escrow, security |
| 13 | Emit `admin:paused` event with admin address in payload for auditability | medium | easy | smart-contract, escrow, events |
| 14 | Emit `admin:unpaused` event with admin address in payload | medium | easy | smart-contract, escrow, events |
| 15 | Emit `admin:oracle_updated` event with old and new oracle addresses | medium | easy | smart-contract, escrow, events |
| 16 | Add `match:cancelled` event payload to include refund amounts for each player | medium | easy | smart-contract, escrow, events |
| 17 | Add `match:deposit` event to also emit which player deposited (player1 or player2 label) | low | easy | smart-contract, escrow, events |
| 18 | Store `cancelled_ledger` in `Match` struct so cancel time is auditable on-chain | low | medium | smart-contract, escrow, transparency |
| 19 | Store `completed_ledger` in `Match` struct so payout time is auditable on-chain | low | medium | smart-contract, escrow, transparency |
| 20 | Add `list_matches` paginated read function returning match IDs within a range | medium | medium | smart-contract, escrow, api |
| 21 | Use `try_transfer` in `cancel_match` refunds instead of `transfer` to surface errors cleanly | high | easy | bug, smart-contract, escrow, security |
| 22 | Add test: `cancel_match` by non-player returns `Error::Unauthorized` | high | easy | testing, smart-contract, escrow |
| 23 | Add test: `deposit` after cancel returns `Error::MatchCancelled` | high | easy | testing, smart-contract, escrow |
| 24 | Add test: `create_match` with duplicate `game_id` returns `Error::DuplicateGameId` | high | easy | testing, smart-contract, escrow |
| 25 | Add test: `submit_result` with mismatched `game_id` returns `Error::GameIdMismatch` | high | easy | testing, smart-contract, escrow |
| 26 | Add test: `create_match` when paused returns `Error::ContractPaused` | medium | easy | testing, smart-contract, escrow |
| 27 | Add test: `deposit` when paused returns `Error::ContractPaused` | medium | easy | testing, smart-contract, escrow |
| 28 | Add test: `submit_result` when paused returns `Error::ContractPaused` | medium | easy | testing, smart-contract, escrow |
| 29 | Add test: draw payout sends `stake_amount` to each player, not `stake_amount * 2` | high | easy | testing, smart-contract, escrow |
| 30 | Add test: `get_escrow_balance` returns 0 after match is completed | medium | easy | testing, smart-contract, escrow |
| 31 | Add test: `get_escrow_balance` returns `stake_amount` after only one player deposits | medium | easy | testing, smart-contract, escrow |
| 32 | Add test: `is_funded` returns false before both deposits and true after | medium | easy | testing, smart-contract, escrow |
| 33 | Add fuzz test for `create_match` with boundary `stake_amount` values (0, 1, i128::MAX) | high | medium | testing, smart-contract, escrow |
| 34 | Add test: `update_oracle` by non-admin returns `Error::Unauthorized` | high | easy | testing, security, smart-contract |
| 35 | Document integer overflow risk in `submit_result`: `stake_amount * 2` with i128 max | high | easy | documentation, security, smart-contract |
| 36 | Add `platform` field validation — reject unknown platform enum variants gracefully | medium | easy | smart-contract, escrow, validation |
| 37 | Ensure `DataKey::GameId` TTL is cleaned up or noted as permanent for expired matches | medium | medium | smart-contract, escrow, storage |
| 38 | Add `get_game_id_owner` read-only function to query which match_id owns a given game_id | low | easy | smart-contract, escrow, api |

---

## Smart Contract — Oracle (`contracts/oracle`)

| # | Title | Priority | Difficulty | Tags |
|---|-------|----------|------------|------|
| 39 | Add `delete_result` admin function to correct a mis-submitted oracle result | high | medium | smart-contract, oracle, security |
| 40 | Add test: `submit_result` by non-admin returns `Error::Unauthorized` | high | easy | testing, smart-contract, oracle |
| 41 | Add test: `transfer_admin` by non-admin is rejected | high | easy | testing, security, smart-contract, oracle |
| 42 | Add test: `submit_result` with empty `game_id` returns `Error::InvalidGameId` | medium | easy | testing, smart-contract, oracle |
| 43 | Add test: `submit_result` with `game_id` longer than 64 bytes returns `Error::InvalidGameId` | medium | easy | testing, smart-contract, oracle |
| 44 | Add test: `get_result` for non-existent match_id returns `Error::ResultNotFound` | medium | easy | testing, smart-contract, oracle |
| 45 | Add test: double-submit for same match_id returns `Error::AlreadySubmitted` | medium | easy | testing, smart-contract, oracle |
| 46 | Add `ResultEntry` `submitted_ledger` field so oracle submission time is auditable | low | easy | smart-contract, oracle, transparency |
| 47 | Add `list_results` paginated query to oracle contract for off-chain reconciliation | low | medium | smart-contract, oracle, api |
| 48 | Emit oracle `result` event with all three `MatchResult` variants covered in tests | medium | easy | testing, smart-contract, oracle |
| 49 | Add `withdraw` admin safety function on oracle contract to reclaim accidentally sent funds | medium | medium | smart-contract, oracle, security |
| 50 | Document re-entrancy analysis confirming Soroban execution model prevents re-entrancy attacks | high | easy | documentation, security, smart-contract |
| 51 | Add property-based test: every `MatchResult` variant round-trips through `submit_result` → `get_result` | medium | medium | testing, smart-contract, oracle |

---

## Off-chain Oracle Service (`apps/backend`)

| # | Title | Priority | Difficulty | Tags |
|---|-------|----------|------------|------|
| 52 | Implement Lichess game result fetcher using `/api/game/{id}` endpoint | high | medium | oracle, backend, feature |
| 53 | Implement Chess.com game result fetcher using `/pub/player/{user}/games` endpoint | high | medium | oracle, backend, feature |
| 54 | Add retry logic with exponential backoff for Lichess and Chess.com API calls | high | medium | oracle, backend, reliability |
| 55 | Add rate limiting guard to prevent exceeding Lichess 30 req/min limit | high | medium | oracle, backend, security |
| 56 | Add HMAC-signed webhook receiver so oracle results can't be spoofed by external callers | high | hard | oracle, backend, security |
| 57 | Implement game-not-found error path: mark match as disputed instead of silently failing | high | medium | oracle, backend, bug |
| 58 | Add structured logging (JSON) to oracle service for production observability | medium | easy | oracle, backend, observability |
| 59 | Add Prometheus metrics endpoint to oracle service (requests, errors, latency) | medium | medium | oracle, backend, observability |
| 60 | Add Dockerfile for off-chain oracle service with multi-stage build | medium | medium | oracle, backend, infrastructure |
| 61 | Add health-check endpoint `GET /health` to oracle service | medium | easy | oracle, backend, infrastructure |
| 62 | Store oracle private key in environment variable; document required secrets in `.env.example` | high | easy | security, oracle, backend, developer-experience |
| 63 | Add integration test: oracle fetches Lichess result and submits to contract on testnet | high | hard | testing, oracle, backend |
| 64 | Implement idempotency check in oracle: skip re-submission if `has_result` returns true | high | easy | oracle, backend, bug |
| 65 | Add dead-letter queue for failed oracle submissions to enable manual retry | medium | medium | oracle, backend, reliability |

---

## Frontend (`apps/frontend`)

| # | Title | Priority | Difficulty | Tags |
|---|-------|----------|------------|------|
| 66 | Implement `CreateMatch` form: player2 address, stake amount, game ID, platform selector | high | medium | frontend, feature, ui |
| 67 | Implement `DepositStake` component: connect wallet, show stake amount, confirm deposit | high | medium | frontend, feature, ui |
| 68 | Implement `MatchStatus` component that polls and displays current match lifecycle state | high | medium | frontend, feature, ui |
| 69 | Wire `handleClaim` in `App.tsx` to actual Stellar SDK transaction submission | high | hard | frontend, bug, feature |
| 70 | Wire `handleBurn` in `App.tsx` to actual Stellar SDK transaction submission | high | hard | frontend, bug, feature |
| 71 | Add `@stellar/stellar-sdk` dependency and initialize Soroban RPC client from env config | high | medium | frontend, feature, infrastructure |
| 72 | Add error boundary around `useStellarWallet` so wallet errors don't crash the whole app | high | easy | frontend, reliability, bug |
| 73 | Display wrong-network banner with expected network name sourced from `VITE_STELLAR_NETWORK` | medium | easy | frontend, ux, ui |
| 74 | Add loading skeletons to async wallet operations to prevent blank content flash | medium | easy | frontend, ux, ui |
| 75 | Add toast notification system for successful and failed transactions | medium | medium | frontend, ux, ui |
| 76 | Add transaction history view listing past matches and payouts for the connected wallet | medium | hard | frontend, feature, ui |
| 77 | Add copy-to-clipboard button for transaction hash returned from claim/burn | low | easy | frontend, ux, ui |
| 78 | Debounce amount input in claim/burn form to avoid excessive re-renders on fast typing | low | easy | frontend, performance |
| 79 | Add input validation: reject non-numeric or negative amounts in claim/burn form | high | easy | frontend, validation, bug |
| 80 | Add max-balance button to auto-fill claim amount from wallet balance | medium | easy | frontend, ux, ui |
| 81 | Extract `claim-burn.css` into Tailwind utility classes to remove the separate CSS file | low | easy | frontend, refactoring |
| 82 | Implement dark mode toggle using Tailwind `dark:` classes | low | medium | frontend, ux, ui |
| 83 | Add keyboard navigation and ARIA labels to all interactive elements in `claim-burn.tsx` | medium | medium | frontend, accessibility |
| 84 | Add `useWallet.ts` hook unit tests covering connect, disconnect, and error states | high | medium | testing, frontend |
| 85 | Add unit test: wrong-network banner renders when wallet is on wrong network | high | easy | testing, frontend |
| 86 | Add unit test: burn form is disabled when wallet is not connected | medium | easy | testing, frontend |
| 87 | Add unit test: claim form submits with correct amount and calls `onClaim` | medium | easy | testing, frontend |
| 88 | Add ESLint config with `@typescript-eslint` and enforce in CI | medium | easy | frontend, developer-experience, ci-cd |
| 89 | Add Prettier config and enforce formatting check in CI | medium | easy | frontend, developer-experience, ci-cd |
| 90 | Show XLM denomination label next to amount input so users know which token they're staking | low | easy | frontend, ux, ui |
| 91 | Add `<title>` and Open Graph meta tags to `index.html` for SEO and link previews | low | easy | frontend, ui |
| 92 | Add `robots.txt` and `favicon.ico` to the frontend public directory | low | easy | frontend, ui |
| 93 | Replace hardcoded `background: '#f5f5f5'` inline style in `App.tsx` with Tailwind class | low | easy | frontend, refactoring |
| 94 | Add `NetworkBadge` component displaying current connected network with colour coding | low | easy | frontend, ux, ui |

---

## CI/CD (`.github/workflows`)

| # | Title | Priority | Difficulty | Tags |
|---|-------|----------|------------|------|
| 95 | Pin `actions/checkout` and `actions/cache` to full commit SHAs to prevent supply-chain attacks | high | easy | security, ci-cd |
| 96 | Add frontend CI job: `tsc --noEmit` type-check and `vitest run` | high | easy | ci-cd, frontend, testing |
| 97 | Add `cargo audit` step to CI that fails on any RUSTSEC advisory | high | easy | security, ci-cd |
| 98 | Add `cargo deny` for dependency license and duplicate-crate checks | medium | easy | security, ci-cd |
| 99 | Add WASM binary size gate to CI: fail if compiled WASM exceeds 64 KB | high | easy | performance, smart-contract, ci-cd |
| 100 | Add concurrency group to CI workflows to cancel stale runs on new push | medium | easy | ci-cd, performance |
| 101 | Add mainnet deploy workflow gated on manual approval (`workflow_dispatch`) and semver tag | high | medium | ci-cd, infrastructure, security |
| 102 | Upload compiled WASM artifacts in CI for reproducibility review | medium | easy | ci-cd, transparency |
| 103 | Add `environments.toml` validation step in CI to catch config regressions early | low | easy | ci-cd, configuration |
| 104 | Add `PULL_REQUEST_TEMPLATE.md` with checklist for contract and frontend changes | medium | easy | developer-experience, ci-cd |
| 105 | Add `dependabot.yml` for both `cargo` and `npm` ecosystem dependency updates | medium | easy | security, developer-experience, ci-cd |
| 106 | Add branch protection rules documentation in `CONTRIBUTING.md` | low | easy | developer-experience, documentation |
| 107 | Split CI `test` job into separate `escrow-tests` and `oracle-tests` jobs for parallelism | medium | easy | ci-cd, performance |
| 108 | Add `cargo tarpaulin` coverage report step and enforce minimum 80% coverage threshold | medium | medium | ci-cd, testing |

---

## Documentation (`docs/`, `README.md`)

| # | Title | Priority | Difficulty | Tags |
|---|-------|----------|------------|------|
| 109 | Write `docs/runbook.md`: emergency pause procedure, oracle key rotation, post-incident steps | high | medium | documentation, infrastructure, security |
| 110 | Add sequence diagrams to `docs/architecture.md` for happy path and draw path | medium | medium | documentation |
| 111 | Write comprehensive `docs/api-reference.md` covering all contract entry points with examples | high | medium | documentation |
| 112 | Add module-level doc comments (`//!`) to `contracts/escrow/src/lib.rs` | low | easy | documentation, smart-contract |
| 113 | Add module-level doc comments (`//!`) to `contracts/oracle/src/lib.rs` | low | easy | documentation, smart-contract |
| 114 | Update `SECURITY.md` with vulnerability disclosure policy, response SLA, and bug bounty info | medium | easy | documentation, security |
| 115 | Document `environments.toml` fields in `README.md` with descriptions and defaults | low | easy | documentation, developer-experience |
| 116 | Add `CHANGELOG.md` entries for all completed fixes with semantic versioning | low | easy | documentation, developer-experience |
| 117 | Add architecture diagram (Mermaid) showing escrow ↔ oracle ↔ Lichess/Chess.com flow | medium | medium | documentation |
| 118 | Write `docs/deployment.md` covering testnet and mainnet deploy steps end-to-end | high | medium | documentation, infrastructure |

---

## Security & Reliability

| # | Title | Priority | Difficulty | Tags |
|---|-------|----------|------------|------|
| 119 | Conduct and document full threat model covering oracle key compromise and admin key loss | high | hard | security, documentation |
| 120 | Verify token allowance is sufficient before `try_transfer` in `deposit` and surface clear error | high | easy | security, smart-contract, escrow |
| 121 | Add re-entrancy analysis test confirming Soroban's single-execution model prevents attacks | high | medium | security, testing, smart-contract |
| 122 | Add `match_id` range validation in all contract functions to reject out-of-bounds IDs early | medium | easy | security, smart-contract |
| 123 | Implement match timeout: allow either player to reclaim funds if game has no result after N ledgers | high | hard | feature, smart-contract, escrow, security |
| 124 | Add oracle result dispute window: allow admin to override an incorrect result within N ledgers | high | hard | feature, smart-contract, oracle, security |
| 125 | Add `pause` + `drain` emergency function allowing admin to recover funds in a critical exploit | high | hard | security, smart-contract, escrow |

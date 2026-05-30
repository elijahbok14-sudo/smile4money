# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Kiro AI-assisted development integration
- `submit_result`: added `game_id` parameter with cross-match injection guard — oracle must supply the `game_id` that matches the stored match record; mismatches return `Error::GameIdMismatch` (E013) before any state is modified
- `Error::GameIdMismatch` (code 13): new error variant to signal oracle submitted a result for the wrong game
- `test_submit_result_wrong_game_id_fails`: unit test asserting `GameIdMismatch` when oracle passes a mismatched `game_id`

## [1.0.0] - 2026-04-25

### Added
- Soroban escrow contract with XLM stake support
- Oracle contract for Lichess result verification
- Automatic winner payout and draw refund logic
- Match creation, deposit, and cancellation flows
- Admin pause/unpause and oracle update controls
- CI workflow via GitHub Actions

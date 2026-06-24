# Contributing to smile4money

Thank you for your interest in contributing! This document covers environment setup, running tests, and PR guidelines.

## Prerequisites

- **Rust** 1.70+ — [rustup.rs](https://rustup.rs)
- **wasm32 target**: `rustup target add wasm32-unknown-unknown`
- **Stellar CLI** — [install guide](https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli)
- **Git**

## Local Setup

```bash
git clone https://github.com/obajecollinsmicheal-cmd/smile4money.git
cd smile4money
cp .env.example .env
# Edit .env with your testnet credentials
```

## Build

```bash
./scripts/build.sh
# or
cargo build --target wasm32-unknown-unknown --release
```

## Test

```bash
./scripts/test.sh
# or
cargo test
```

Run lints before opening a PR:

```bash
cargo clippy -- -D warnings
```

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Bug fix | `fix/issue-<N>-short-description` | `fix/issue-1-double-initialize` |
| New test | `test/issue-<N>-short-description` | `test/issue-22-cancel-partial-refund` |
| Documentation | `docs/issue-<N>-short-description` | `docs/issue-220-contributing-guide` |
| Feature | `feat/issue-<N>-short-description` | `feat/issue-17-update-oracle` |
| Refactor | `refactor/issue-<N>-short-description` | `refactor/issue-221-workspace-deps` |

Always branch off `master`:

```bash
git checkout master && git pull
git checkout -b fix/issue-<N>-short-description
```

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short summary (≤72 chars)>
```

Types: `fix`, `feat`, `test`, `docs`, `refactor`, `chore`.

Examples:
```
fix: guard initialize against double-call
test: cancel_match refunds only player1 when only player1 deposited
docs: add CONTRIBUTING.md with dev setup and PR guidelines
refactor: move shared deps to workspace-level Cargo.toml
```

## Pull Request Checklist

Before submitting a PR, confirm:

- [ ] `cargo test` passes
- [ ] `cargo clippy -- -D warnings` passes
- [ ] Branch is up to date with `master`
- [ ] PR title is under 70 characters
- [ ] PR body contains `Closes #<N>` for each linked issue
- [ ] New behaviour is covered by tests
- [ ] No secrets or `.env` files are committed

## CI Security: Action Pinning

All third-party GitHub Actions used in `.github/workflows/*.yml` **must** be pinned to their full immutable commit SHA, not to a version tag. This prevents supply-chain attacks where a tag is silently moved to a malicious commit.

```
# ✅ Correct — pinned by SHA with a version comment
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4

# ❌ Incorrect — mutable tag reference
- uses: actions/checkout@v4
```

When adding or updating an action:

1. Resolve the SHA by querying the upstream repository.
2. Use the full 40-character SHA after `@`.
3. Append the original version as a trailing comment (e.g. `# v4`).

To resolve the SHA for a tagged action:

```bash
git ls-remote https://github.com/<owner>/<repo>.git refs/tags/<tag>
```

---

## Reporting Issues

Open a GitHub issue with:
- A clear title prefixed with the category (`Fix:`, `Test:`, `Docs:`, `Feat:`)
- Steps to reproduce (for bugs)
- Expected vs actual behaviour

For security vulnerabilities, see [SECURITY.md](SECURITY.md).

# Changelog

## 0.1.1 — 2026-08-17

- Redact secret-like values inherited from the runner environment, including custom `_KEY`, credential, and JWT names.
- Fail the release gate when committed `dist/` bundles do not match `src/`.
- State the exact five-job operating-system and Node.js matrix.
- Report an accurate error for invalid `--fail-on` values.
- Document the trusted-configuration boundary for Windows `.cmd` and `.bat` shims.

## 0.1.0 — 2026-08-16

- First working CLI and GitHub Action.
- PASS / FAIL / UNKNOWN receipts for install, PATH, version, launch, helpers, uninstall, and residue.
- Ten deterministic gold-standard fixtures.
- Linux, macOS, and Windows CI matrix.

# Validation record — 2026-08-17

## Controlled gold standards

The release suite passed all ten deterministic channel fixtures:

| Fixture | Expected | Observed | Evidence focus |
|---|---:|---:|---|
| known good | PASS | PASS | complete install-to-uninstall path |
| same version with `v` prefix | PASS | PASS | version normalization |
| stale public version | FAIL | FAIL | expected vs delivered version |
| launch hangs | FAIL | FAIL | bounded timeout and process termination |
| old PATH entry shadows new install | FAIL | FAIL | both real paths and the winning executable |
| required helper missing | FAIL | FAIL | exact missing helper path |
| uninstall residue | FAIL | FAIL | residual path and byte size |
| permanent install error | FAIL | FAIL | product failure classification |
| transient registry timeout | UNKNOWN | UNKNOWN | environment failure is not blamed on product |
| no expected version | UNKNOWN | UNKNOWN | uncertainty is not converted to success |

The same suite also proved that JSON and Markdown verdicts agree, every failure has a re-run command, common credentials, secret-like inherited environment values, and the local home path are redacted, and the bundled GitHub Action writes outputs plus a job summary. The complete automated suite passed 9 of 9 tests.

## Real public package

The dated configuration in `validation/codex-npm-2026-08-16.json` queried and pinned the public npm `latest` value for `@openai/codex`: `0.147.0`.

The preserved receipt reports tool version `0.1.0`. This real public-package run predates `v0.1.1` and has not been repeated with `v0.1.1`; the separate `v0.1.1` five-job evidence is recorded below.

On a disposable macOS arm64 prefix, the tool:

- installed the public package without login or credentials;
- found the isolated executable ahead of two already-existing Codex paths;
- observed `codex-cli 0.147.0`;
- completed `codex --help`;
- uninstalled the package; and
- proved both declared residue paths absent.

Overall result: **PASS**. The preserved machine and human receipts are under `validation/results/codex-npm-2026-08-16/`.

## Fresh-directory reproduction

A copy excluding `node_modules`, fixture output, and validation results completed:

1. `npm ci` from `package-lock.json`;
2. strict TypeScript checking;
3. all automated tests;
4. dependency license validation;
5. distribution and workflow pin validation; and
6. a first good-channel CLI run.

## Dependency and license checks

- npm advisory result: 0 known vulnerabilities on 2026-08-17.
- Resolved dependency licenses: MIT and Apache-2.0 only.
- Runtime dependencies: none.
- Workflow actions: full 40-character commit pins.

## Public v0.1.1 multi-platform evidence

The `v0.1.1` tag points to commit `9ef03764fc7a5f371a1968e2fae92a524d315d52`. Its [public GitHub Actions run](https://github.com/yanjinzheng2005-gif/cli-channel-parity/actions/runs/31962205924) passed all five jobs:

- Ubuntu with Node.js 20, 22, and 24;
- macOS with Node.js 24; and
- Windows with Node.js 24.

Every job installed locked dependencies, found zero npm advisory vulnerabilities, ran the complete release gate, proved the committed bundles match their source, exercised the committed bundled Action, and uploaded its example receipt.

An earlier release-candidate run correctly exposed that Windows line-ending conversion made source maps non-reproducible. The repository now pins text checkouts to LF, and both the subsequent [main run](https://github.com/yanjinzheng2005-gif/cli-channel-parity/actions/runs/31961880037) and the immutable `v0.1.1` tag run passed on Windows.

## Previous v0.1.0 evidence

The `v0.1.0` tag points to commit `4e4c0a3ab7f95aae19335e9cd7aa1463d1d42bd7`. Its [public GitHub Actions run](https://github.com/yanjinzheng2005-gif/cli-channel-parity/actions/runs/31955847194) passed all five jobs:

- Ubuntu with Node.js 20, 22, and 24;
- macOS with Node.js 24; and
- Windows with Node.js 24.

Every job installed locked dependencies, ran the npm advisory audit, executed the then-current release gate, exercised the committed bundled Action, and uploaded its example receipt. The Windows runner also proves `.cmd` shim execution and process-tree cleanup for timed-out probes.

This evidence is limited to the named runner images and recorded time. It must not be represented as proof for every operating system, installation channel, or user machine. External repository adoption and human readability are still unproven.

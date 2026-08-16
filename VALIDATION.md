# Validation record — 2026-08-16

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

The same suite also proved that JSON and Markdown verdicts agree, every failure has a re-run command, common credentials and the local home path are redacted, and the bundled GitHub Action writes outputs plus a job summary.

## Real public package

The dated configuration in `validation/codex-npm-2026-08-16.json` queried and pinned the public npm `latest` value for `@openai/codex`: `0.147.0`.

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

- npm advisory result: 0 known vulnerabilities on 2026-08-16.
- Resolved dependency licenses: MIT and Apache-2.0 only.
- Runtime dependencies: none.
- Workflow actions: full 40-character commit pins.

## Not yet proven

The repository is not uploaded yet, so the Linux and Windows GitHub-hosted jobs have not produced public run URLs. The checked-in CI matrix is the next acceptance gate after repository creation. A local macOS result must not be represented as proof for every operating system or user machine.

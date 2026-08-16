# CLI Release Channel Parity

**A receipt for what users actually get from each public CLI install channel.**

A release can be correct on GitHub while Homebrew still serves an older version, npm resolves to a different executable, an installer omits a required helper, or uninstall leaves a stale command behind. This project runs the public install path on a clean runner and emits one consistent `PASS`, `FAIL`, or `UNKNOWN` receipt.

> Status: working 0.1.1 experiment. The controlled acceptance suite passes locally. Public CI covers Ubuntu on Node 20, 22, and 24, plus macOS and Windows on Node 24.

## What it proves

For every configured channel, the tool checks:

1. the public install command completed;
2. the executable that actually wins on `PATH`;
3. the installed semantic version;
4. a side-effect-free startup command such as `--help`;
5. required helper files;
6. the declared uninstall command; and
7. exact paths that should be absent after uninstall.

Every receipt records the operating system, architecture, Node version, channel, actual executable path, actual version, evidence, and a minimal re-run command.

## Honest boundary

This is not a release builder, package manager, vulnerability scanner, signature verifier, malicious-package detector, or full CLI regression framework. It does not modify a user's real machine automatically. A result proves what happened on the named runner at that time; it does not claim to represent every accumulated user environment.

## Quick start

Requirements: Node.js 20 or newer.

```bash
npm ci
npm run build
node dist/cli.js run \
  --config fixtures/channels.json \
  --channel good \
  --output channel-parity-output
```

Open:

- `channel-parity-output/channel-parity-report.md` for people;
- `channel-parity-output/channel-parity-report.json` for automation.

The repository includes ten controlled channels. Running the full fixture file intentionally returns an overall `FAIL`, because it contains known stale, hanging, shadowed, incomplete, and residue-producing installations. The automated test suite verifies every expected result instead:

```bash
npm run test:release
```

## GitHub Action

Use the published Action from this repository and pin a released tag or commit:

```yaml
name: CLI channel receipt

on:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  parity:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: yanjinzheng2005-gif/cli-channel-parity@v0.1.1
        id: parity
        with:
          config: .github/channel-parity.json
          channel: npm
          output-directory: channel-parity-output
          fail-on: unknown
```

The Action also appends the human report to the job summary. Outputs are:

- `result`: `PASS`, `FAIL`, or `UNKNOWN`;
- `report-json`: absolute JSON receipt path;
- `report-markdown`: absolute Markdown receipt path.

Use one matrix job per operating system and public channel. That keeps a failed channel independent and makes the receipt's environment explicit.

## Configuration

V1 uses JSON so the repository has no YAML runtime dependency. Start with [`examples/channel-parity.example.json`](examples/channel-parity.example.json). Editor validation is available in [`schema/channel-parity.schema.json`](schema/channel-parity.schema.json).

```json
{
  "schemaVersion": 1,
  "product": "acme-cli",
  "expectedVersion": "1.2.3",
  "channels": [
    {
      "id": "npm",
      "executable": "acme",
      "expectedExecutablePath": "${WORK_DIR}/npm-prefix/bin/acme${EXECUTABLE_SUFFIX}",
      "env": {
        "PATH": "${WORK_DIR}/npm-prefix/bin${PATH_DELIMITER}${PATH}"
      },
      "install": {
        "argv": [
          "npm",
          "install",
          "--global",
          "--prefix",
          "${WORK_DIR}/npm-prefix",
          "acme-cli@1.2.3"
        ]
      },
      "launch": {
        "argv": ["${EXECUTABLE}", "--help"],
        "timeoutMs": 10000
      },
      "uninstall": {
        "argv": [
          "npm",
          "uninstall",
          "--global",
          "--prefix",
          "${WORK_DIR}/npm-prefix",
          "acme-cli"
        ]
      },
      "residuePaths": [
        "${WORK_DIR}/npm-prefix/bin/acme${EXECUTABLE_SUFFIX}",
        "${WORK_DIR}/npm-prefix/lib/node_modules/acme-cli"
      ]
    }
  ]
}
```

### Command model

Commands are argument arrays, not shell strings. Native executables run directly with `shell: false`. Windows cannot execute `.cmd` or `.bat` shims directly, so those files are passed to `cmd.exe /d /c` while the outer process still uses `shell: false`.

Configurations are executable instructions and must be repository-owned and reviewed. On Windows, do not place `cmd.exe` metacharacters such as `&`, `|`, `%`, `<`, or `>` in `.cmd`/`.bat` arguments. Put complex logic in a reviewed script file and invoke that file as one argument-array command.

Each command supports:

| Field | Meaning |
|---|---|
| `argv` | Required executable and arguments |
| `cwd` | Optional working directory |
| `env` | Extra environment values for only that command |
| `timeoutMs` | Kill the command after this duration |
| `allowedExitCodes` | Defaults to `[0]` |
| `maxOutputBytes` | Per-stream output cap |

For a GitHub Release or native installer that needs download, extraction, and placement, commit a small installer script to the CLI's own repository and call that script as one `argv` command. The parity tool deliberately does not download and execute an unreviewed remote shell string.

### Template variables

| Variable | Value |
|---|---|
| `${RUN_DIR}` | Isolated temporary root for the whole receipt |
| `${WORK_DIR}` | Isolated directory for this channel |
| `${CONFIG_DIR}` | Directory containing the JSON file |
| `${CHANNEL}` | Current channel ID |
| `${PATH}` | Runner's original `PATH` |
| `${PATH_DELIMITER}` | `:` on POSIX, `;` on Windows |
| `${EXECUTABLE_SUFFIX}` | Empty on POSIX, `.cmd` on Windows |
| `${EXECUTABLE}` | Actual first executable found after install |
| `${EXECUTABLE_DIR}` | Directory containing that executable |

`EXECUTABLE` and `EXECUTABLE_DIR` are available only after installation, so use them in version, launch, helper, uninstall, and residue declarations—not in the install command.

### PATH result

- no match: `FAIL`;
- declared expected path is not first: `FAIL`;
- multiple matches without an expected winner: `UNKNOWN` by default;
- expected first match, or one unambiguous match: `PASS`.

`pathPolicy: "single"` makes multiple matches a failure. `pathPolicy: "report"` keeps the default uncertainty behavior.

### Version result

The default command is `${EXECUTABLE} --version`. The parser accepts a semantic version such as `1.2.3`, `v1.2.3`, or `1.2.3-beta.1` in ordinary CLI output.

- expected and actual versions match: `PASS`;
- they differ, or the version command fails/hangs: `FAIL`;
- actual version exists but no expected version was declared: `UNKNOWN`;
- output has no provable semantic version: `UNKNOWN`.

### Transient install result

Network signals such as `ETIMEDOUT`, `ECONNRESET`, DNS errors, and HTTP 429/502/503/504 produce `UNKNOWN`, not `FAIL`. Add channel-specific regular expressions with `transientPatterns`.

The tool never converts `UNKNOWN` to `PASS`.

## Exit codes

| Code | Meaning |
|---:|---|
| `0` | PASS, or UNKNOWN when `--fail-on fail` was chosen |
| `1` | At least one product failure |
| `2` | UNKNOWN and the default `--fail-on unknown` policy |
| `3` | Invalid configuration or execution setup error |

## Redaction and safe operation

The report replaces:

- the current home directory with `$HOME`;
- common GitHub, npm, OpenAI-style, and bearer-token shapes;
- values listed in top-level `redactions`;
- inherited runner and channel environment values whose names look like token, secret, password, key, auth, credential, or JWT fields.

Still, use public no-secret install paths whenever possible. Run configurations from untrusted repositories only on disposable runners. See [`SECURITY.md`](SECURITY.md).

## Acceptance evidence

The automated suite contains deterministic gold standards for:

- expected version and same version;
- stale channel version;
- hanging startup timeout;
- old PATH entry shadowing a new install;
- missing helper;
- uninstall residue with byte size;
- permanent install failure;
- transient registry failure;
- missing expected version;
- JSON/Markdown agreement and redaction;
- the bundled GitHub Action output and job summary.

Run `npm run test:release` before every release. The committed CI matrix runs Ubuntu with Node 20, 22, and 24, macOS with Node 24, and Windows with Node 24. The release gate also rebuilds `dist/` and fails if the committed Action bundles do not match `src/`.

## License

Apache-2.0. Development dependencies and their licenses are recorded in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

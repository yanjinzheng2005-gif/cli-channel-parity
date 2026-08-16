# OpenAI Codex CLI — public npm channel snapshot 2026-08-16 — channel parity receipt

**✅ Overall result: PASS**

Tested 2026-08-16T15:02:28.366Z → 2026-08-16T15:02:31.852Z on darwin/arm64 with v25.3.0.

> This receipt proves only what happened on the named runner at the recorded time. It does not represent every user machine.

## ✅ @openai/codex from the public npm registry: PASS

- Channel ID: `npm-latest`
- Expected version: `0.147.0`
- Actual version: `0.147.0`
- Executable used: `/private/var/folders/lf/c_v1fsgj59z6nss4gxj32cww0000gn/T/cli-channel-parity-dE4IVH/npm-latest/npm-prefix/lib/node_modules/@openai/codex/bin/codex.js`
- Re-run: `channel-parity run --config $HOME/Documents/Codex/2026-08-15/micro-tool-lab-100-3-100/product-002-cli-release-channel-parity/validation/codex-npm-2026-08-16.json --channel npm-latest --output $HOME/Documents/Codex/2026-08-15/micro-tool-lab-100-3-100/product-002-cli-release-channel-parity/validation/results/codex-npm-2026-08-16`

| Check | Result | What happened |
|---|---:|---|
| Public-channel install | ✅ PASS | The declared public install command completed. |
| Executable and PATH | ✅ PASS | The executable resolved to the expected first PATH entry. |
| Installed version | ✅ PASS | This channel delivered the expected version 0.147.0. |
| Minimal launch | ✅ PASS | The installed executable completed the declared side-effect-free launch probe. |
| Required helpers | ✅ PASS | No required helper files were declared. |
| Uninstall | ✅ PASS | The declared uninstall command completed. |
| Uninstall residue | ✅ PASS | All declared executable and helper paths were absent after uninstall. |

<details><summary>Evidence</summary>

### Public-channel install

- `command: npm install --global --prefix /var/folders/lf/c_v1fsgj59z6nss4gxj32cww0000gn/T/cli-channel-parity-dE4IVH/npm-latest/npm-prefix @openai/codex@0.147.0`
- `exit: 0; 1444 ms`
- `stdout: added 2 packages in 1s`

### Executable and PATH

- `1. /private/var/folders/lf/c_v1fsgj59z6nss4gxj32cww0000gn/T/cli-channel-parity-dE4IVH/npm-latest/npm-prefix/lib/node_modules/@openai/codex/bin/codex.js`
- `2. $HOME/.nvm/versions/node/v20.20.0/lib/node_modules/@openai/codex/bin/codex.js`
- `3. /Applications/ChatGPT.app/Contents/Resources/codex`

### Installed version

- `command: /private/var/folders/lf/c_v1fsgj59z6nss4gxj32cww0000gn/T/cli-channel-parity-dE4IVH/npm-latest/npm-prefix/lib/node_modules/@openai/codex/bin/codex.js --version`
- `exit: 0; 1809 ms`
- `stdout: codex-cli 0.147.0`

### Minimal launch

- `command: /private/var/folders/lf/c_v1fsgj59z6nss4gxj32cww0000gn/T/cli-channel-parity-dE4IVH/npm-latest/npm-prefix/lib/node_modules/@openai/codex/bin/codex.js --help`
- `exit: 0; 67 ms`
- `stdout: Codex CLI

If no subcommand is specified, options will be forwarded to the interactive CLI.

Usage: codex [OPTIONS] [PROMPT]
       codex [OPTIONS] <COMMAND> [ARGS]

Commands:
  exec            Run Codex non-interactively [aliases: e]
  review          Run a code review non-interactively
  login           Manage login
  logout          Remove stored authentication credentials
  mcp             Manage external MCP servers for Codex
  plugin          Manage Codex plugins
  mcp-server      Start Codex as an MCP server (stdio)
  app-server      [experimental] Run the app server or related tooling
  remote-control  [experimental] Manage the app-server daemon with remote control enabled
  app             Launch the Desktop app (opens the app installer if missing)
  completion      Generate shell completion scripts
  update          Update Codex to the latest version
  doctor          Diagnose local Codex installation, config, auth, and runtime health
  sandbox         Run commands within a Codex-provided sandbox
  debug           Debugging tools
  apply           Apply the latest diff produced by Codex agent as a \`git apply\` to your local
                  working tree [aliases: a]
  resume          Resume a previous interactive session (picker by default; use --last to continue
                  the most recent)
  archive         Archive a saved session by id or session name
  delete          Permanently delete a saved session by id or session name
  unarchive       Unarchive a saved session by id or session name
  fork            Fork a previous interactive session (picker by default; use --last to fork the
                  most recent)
  cloud           [EXPERIMENTAL] Browse tasks from Codex Cloud and apply changes locally
  exec-server     [EXPERIMENTAL] Run the standalone exec-server service
  features        Inspect feature flags
  help            Print this message or the help of the given subcommand(s)

Arguments:
  [PROMPT]
          Optional user prompt to start the session

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from \`~/.codex/config.toml\`.
          Use a dotted path (\`foo.bar.baz\`) to override nested values. The \`value\` portion is parsed
          as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - \`-c model="o3"\` - \`-c 'sandbox_permissions=["disk-full-read-access"]'\` - \`-c
          shell_environment_policy.inherit=all\`

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to \`-c features.<name>=true\`

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to \`-c features.<name>=false\`

      --remote <ADDR>
          Connect the TUI to a remote app server endpoint.

          Accepted forms: \`ws://host:port\`, \`wss://host:port\`, \`unix://\`, or \`unix://PATH\`.

      --remote-auth-token-env <ENV_VAR>
          Name of the environment variable containing the bearer token to send to a remote app
          server websocket

      --strict-config
          Error out when config.toml contains fields that are not recognized by this version of
          Codex

  -i, --image <FILE>...
          Optional image(s) to attach to the initial prompt

  -m, --model <MODEL>
          Model the agent should use

      --oss
          Use open-source provider

      --local-provider <OSS_PROVIDER>
          Specify which local provider to use (lmstudio or ollama). If not specified with --oss,
          will use config default or show selection

  -p, --profile <CONFIG_PROFILE_V2>
          Layer $CODEX_HOME/<name>.config.toml on top of the base user config

  -s, --sandbox <SANDBOX_MODE>
          Select the sandbox policy to use when executing model-generated shell commands

          [possible values: read-only, workspace-write, danger-full-access]

      --approve-for-me
          Route approval requests through automatic review using the workspace-write sandbox

      --dangerously-bypass-approvals-and-sandbox
          Skip all confirmation prompts and execute commands without sandboxing. EXTREMELY
          DANGEROUS. Intended solely for running in environments that are externally sandboxed

      --dangerously-bypass-hook-trust
          Run enabled hooks without requiring persisted hook trust for this invocation. DANGEROUS.
          Intended only for automation that already vets hook sources

  -C, --cd <DIR>
          Tell the agent to use the specified directory as its working root

      --add-dir <DIR>
          Additional directories that should be writable alongside the primary workspace

  -a, --ask-for-approval <APPROVAL_POLICY>
          Configure when the model requires human approval before executing a command

          Possible values:
          - untrusted:  Only run "trusted" commands (e.g. ls, cat, sed) without asking for user
            approval. Will escalate to the user if the model proposes a command that is not in the
            "trusted" set
          - on-request: The model decides when to ask the user for approval
          - never:      Never ask for user approval Execution failures are immediately returned to
            the model

      --search
          Enable live web search. When enabled, the native Responses \`web_search\` tool is available
          to the model (no per‑call approval)

      --no-alt-screen
          Disable alternate screen mode

          Runs the TUI in inline mode, preserving terminal scrollback history.

  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version`

### Required helpers

- `No helper contract declared`

### Uninstall

- `command: npm uninstall --global --prefix /var/folders/lf/c_v1fsgj59z6nss4gxj32cww0000gn/T/cli-channel-parity-dE4IVH/npm-latest/npm-prefix @openai/codex`
- `exit: 0; 160 ms`
- `stdout: removed 2 packages in 94ms`

### Uninstall residue

- `absent: /var/folders/lf/c_v1fsgj59z6nss4gxj32cww0000gn/T/cli-channel-parity-dE4IVH/npm-latest/npm-prefix/bin/codex`
- `absent: /var/folders/lf/c_v1fsgj59z6nss4gxj32cww0000gn/T/cli-channel-parity-dE4IVH/npm-latest/npm-prefix/lib/node_modules/@openai/codex`

</details>

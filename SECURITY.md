# Security policy

## What this project is — and is not

CLI Release Channel Parity executes the exact argument arrays declared in a repository-owned JSON file. It is a delivery receipt, not a vulnerability scanner, malware detector, signature verifier, or package trust system.

Run untrusted configurations only inside a disposable runner. Do not use `keep-run-directory` on a shared machine. Prefer public install channels that need no secret. If a command needs a token, pass it through the runner environment; never write it into the JSON file.

The reporter redacts common token shapes, configured redaction values, secret-like values from the inherited runner environment and channel environment, and the current home directory. Redaction is defense in depth, not permission to print secrets deliberately.

Native executables run without a shell. Windows `.cmd` and `.bat` shims necessarily pass through `cmd.exe`; keep their arguments free of command-shell metacharacters and put complex logic in a reviewed script file. Treat every configuration as executable code.

## Reporting a vulnerability

Please use the repository's private GitHub Security Advisory flow. Do not publish a working exploit or a real credential in a public issue.

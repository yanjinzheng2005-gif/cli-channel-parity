# Third-party notices

The runtime bundles have no third-party runtime dependency. Development and build tooling is locked in `package-lock.json`:

| Package | Purpose | License | Included in runtime bundle? |
|---|---|---|---:|
| TypeScript | Static type checking | Apache-2.0 | No |
| esbuild | Produces the CLI and Action bundles | MIT | No |
| @types/node | Node.js type declarations | MIT | No |
| undici-types | Transitive type declarations | MIT | No |

The complete resolved versions and integrity hashes are recorded in `package-lock.json`. GitHub Actions used by the repository workflows are pinned to full commit hashes and are not copied into this project.

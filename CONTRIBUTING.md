# Contributing

Before opening a change:

1. keep the product boundary focused on public-channel delivery evidence;
2. do not add vulnerability scanning, signature verification, release publishing, or automatic repair;
3. add a deterministic failing fixture before fixing a behavior;
4. run `npm run test:release`;
5. commit updated `dist/` bundles because GitHub Actions executes them directly; the release gate rejects source/bundle drift.

Bug reports should include the operating system, architecture, channel configuration with secrets removed, the JSON receipt, and the smallest reproducible public package.

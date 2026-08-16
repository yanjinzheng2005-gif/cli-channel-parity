import assert from "node:assert/strict";
import test from "node:test";
import os from "node:os";
import { aggregateVerdicts, isTransientFailure, parseVersion, Redactor } from "../dist/library.js";

test("verdict aggregation never hides failure or uncertainty", () => {
  assert.equal(aggregateVerdicts(["PASS", "PASS"]), "PASS");
  assert.equal(aggregateVerdicts(["PASS", "UNKNOWN"]), "UNKNOWN");
  assert.equal(aggregateVerdicts(["UNKNOWN", "FAIL"]), "FAIL");
});

test("transient installation errors are classified separately", () => {
  assert.equal(isTransientFailure("request failed: ETIMEDOUT"), true);
  assert.equal(isTransientFailure("registry returned HTTP 503"), true);
  assert.equal(isTransientFailure("package manifest is malformed"), false);
  assert.equal(isTransientFailure("mirror is sleeping", ["mirror is sleeping"]), true);
});

test("version parser accepts common CLI output without guessing non-semver text", () => {
  assert.equal(parseVersion("tool v1.2.3\n"), "1.2.3");
  assert.equal(parseVersion("version 2.0.0-beta.1"), "2.0.0-beta.1");
  assert.equal(parseVersion("build next"), undefined);
});

test("redactor removes configured values, common tokens, and the private home path", () => {
  const redactor = new Redactor(["fixture-super-secret"], [{ API_TOKEN: "another-secret" }]);
  const result = redactor.text(`${os.homedir()}/project ghp_abcdefghijklmnopqrstuvwxyz fixture-super-secret another-secret`);
  assert.equal(result.includes(os.homedir()), false);
  assert.equal(result.includes("fixture-super-secret"), false);
  assert.equal(result.includes("another-secret"), false);
  assert.match(result, /\$HOME/);
  assert.match(result, /\[REDACTED\]/);
  assert.equal(redactor.text("https://example.test/?token=visible&mode=test"), "https://example.test/?token=[REDACTED]&mode=test");
  assert.equal(redactor.text("the bearer token to send"), "the bearer token to send");
  assert.equal(redactor.text("Authorization: Bearer abcdefghijklmnop"), "Authorization: [REDACTED]");
});

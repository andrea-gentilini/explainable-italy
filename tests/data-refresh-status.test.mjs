import assert from "node:assert/strict";
import { test } from "node:test";
import { buildRefreshStatus, updateRefreshStatus } from "../scripts/data-refresh-status.mjs";

const commit = "a".repeat(40);
const repositoryCommit = "b".repeat(40);
const fileSha = "c".repeat(40);
const checksum = "d".repeat(64);
const repository = "andrea-gentilini/explainable-italy";
const attemptedAt = "2026-10-14T09:00:00.000Z";
const manifest = { datasets: [{ datasetCode: "gov_10a_exp", sha256: checksum }] };
const context = {
  outcome: "success", attemptedAt, sourceCommit: commit, repositoryCommit,
  runUrl: `https://github.com/${repository}/actions/runs/10/attempts/1`, manifest,
};
const options = { repository, runId: "10", runAttempt: "1", sourceCommit: commit, outcome: "success", attemptedAt, manifest };
const mainRef = { object: { type: "commit", sha: repositoryCommit } };
const asFile = (status, sha = fileSha) => ({ type: "file", encoding: "base64", sha, content: Buffer.from(JSON.stringify(status)).toString("base64") });
const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { status });

function responseBody(call) {
  return JSON.parse(Buffer.from(call.body.content, "base64").toString("utf8"));
}

test("a successful audit records exact source checksums and provenance", () => {
  const status = buildRefreshStatus(context);
  assert.equal(status.schemaVersion, 1);
  assert.deepEqual(status.lastSuccessfulCheck, { checkedAt: attemptedAt, sourceCommit: commit, datasets: { gov_10a_exp: checksum } });
  assert.equal(status.repositoryCommit, repositoryCommit);
  assert.equal(status.proposalUrl, null);
});

test("failure and cancellation preserve the last successful audit without trusting a candidate manifest", () => {
  const previous = buildRefreshStatus(context);
  for (const outcome of ["failure", "cancelled"]) {
    const status = buildRefreshStatus({ ...context, previous, outcome, attemptedAt: "2026-10-21T09:00:00.000Z", manifest: { malformed: true } });
    assert.deepEqual(status.lastSuccessfulCheck, previous.lastSuccessfulCheck);
    assert.notEqual(status.lastSuccessfulCheck, previous.lastSuccessfulCheck);
    assert.equal(status.outcome, outcome);
  }
  assert.equal(buildRefreshStatus({ ...context, outcome: "failure", manifest: undefined }).lastSuccessfulCheck, null);
});

test("successful audits require unique valid source hashes and fail closed on malformed existing records", () => {
  assert.throws(() => buildRefreshStatus({ ...context, manifest: undefined }), /manifest/);
  assert.throws(() => buildRefreshStatus({ ...context, manifest: { datasets: [{ datasetCode: "gov_10a_exp", sha256: "bad" }] } }), /checksum/);
  assert.throws(() => buildRefreshStatus({ ...context, manifest: { datasets: [...manifest.datasets, ...manifest.datasets] } }), /Duplicate/);
  const previous = buildRefreshStatus(context);
  assert.throws(() => buildRefreshStatus({ ...context, previous: { ...previous, schemaVersion: 2 } }), /schema/);
  assert.throws(() => buildRefreshStatus({ ...context, previous: { ...previous, lastSuccessfulCheck: null } }), /does not match/);
  assert.throws(() => buildRefreshStatus({ ...context, previous: { ...previous, lastSuccessfulCheck: { ...previous.lastSuccessfulCheck, datasets: { gov_10a_exp: "bad" } } } }), /successful-check/);
  assert.throws(() => buildRefreshStatus({ ...context, previous, attemptedAt: "2026-10-13T09:00:00.000Z" }), /stale/);
});

test("new audits create only the status file on main and leave commit identity to GitHub", async () => {
  const calls = [];
  const result = await updateRefreshStatus({ ...options, request: async (call) => {
    calls.push(call);
    if (call.path.endsWith("/git/ref/heads/main")) return mainRef;
    if (call.method === "GET") throw httpError(404);
    return { commit: { sha: "e".repeat(40) } };
  } });
  assert.equal(result.updated, true);
  const writes = calls.filter((call) => call.method === "PUT");
  assert.equal(writes.length, 1);
  assert.equal(writes[0].path, `/repos/${repository}/contents/.github/data-refresh-status.json`);
  assert.equal(writes[0].body.branch, "main");
  assert.equal(writes[0].body.sha, undefined);
  assert.equal(writes[0].body.author, undefined);
  assert.equal(writes[0].body.committer, undefined);
  assert.equal(responseBody(writes[0]).lastSuccessfulCheck.datasets.gov_10a_exp, checksum);
});

test("a concurrent status update is reread and its successful check is preserved on retry", async () => {
  const original = buildRefreshStatus({ ...context, outcome: "failure" });
  const successful = buildRefreshStatus({ ...context, attemptedAt: "2026-10-20T09:00:00.000Z", sourceCommit: "e".repeat(40) });
  const writes = [];
  let reads = 0;
  await updateRefreshStatus({ ...options, outcome: "failure", manifest: undefined, attemptedAt: "2026-10-21T09:00:00.000Z", request: async (call) => {
    if (call.path.endsWith("/git/ref/heads/main")) return mainRef;
    if (call.method === "GET") return ++reads === 1 ? asFile(original) : asFile(successful, "f".repeat(40));
    writes.push(call);
    if (writes.length === 1) throw httpError(409);
    return {};
  } });
  assert.equal(writes.length, 2);
  assert.equal(writes[1].body.sha, "f".repeat(40));
  assert.deepEqual(responseBody(writes[1]).lastSuccessfulCheck, successful.lastSuccessfulCheck);
  assert.equal(responseBody(writes[1]).outcome, "failure");
});

test("the recorder stops after three conflict retries and does not retry permission failures", async () => {
  for (const status of [409, 403]) {
    let writes = 0;
    await assert.rejects(updateRefreshStatus({ ...options, request: async (call) => {
      if (call.path.endsWith("/git/ref/heads/main")) return mainRef;
      if (call.method === "GET") throw httpError(404);
      writes++;
      throw httpError(status);
    } }), { status });
    assert.equal(writes, status === 409 ? 4 : 1);
  }
});

test("a newer remote attempt cannot be overwritten by an older workflow", async () => {
  const newer = buildRefreshStatus({ ...context, attemptedAt: "2026-10-21T09:00:00.000Z" });
  const result = await updateRefreshStatus({ ...options, request: async (call) => {
    assert.equal(call.method, "GET");
    return call.path.endsWith("/git/ref/heads/main") ? mainRef : asFile(newer);
  } });
  assert.equal(result.updated, false);
  assert.deepEqual(result.status, newer);
});

test("invalid stored status and unsafe inputs stop before any write", async () => {
  for (const stored of [{ arbitrary: true }, null, { ...buildRefreshStatus(context), outcome: "unknown" }]) {
    await assert.rejects(updateRefreshStatus({ ...options, request: async (call) => {
      assert.equal(call.method, "GET");
      return call.path.endsWith("/git/ref/heads/main") ? mainRef : asFile(stored);
    } }), /status/);
  }
  for (const input of [{ repository: "../../other" }, { runId: "1/../../" }, { sourceCommit: "main" }, { proposalUrl: "https://github.com/another/repository/pull/1" }]) {
    await assert.rejects(updateRefreshStatus({ ...options, ...input, request: async () => assert.fail("Invalid input must not reach GitHub") }));
  }
});

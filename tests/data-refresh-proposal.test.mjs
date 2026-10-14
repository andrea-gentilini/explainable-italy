import assert from "node:assert/strict";
import test from "node:test";
import { guardDataProposal } from "../scripts/data-refresh-proposal.mjs";

const sha = "a".repeat(40);
const args = { repository: "example/project", sourceCommit: sha };
function requests(branch, author = "github-actions[bot]", committer = author) {
  const seen = [];
  const request = async (path) => {
    seen.push(path);
    if (path.endsWith("heads/main")) return { object: { sha } };
    if (path.includes("git/ref/heads/automation")) return branch ? { object: { sha: "b".repeat(40) } } : null;
    return { author: { login: author }, committer: { login: committer }, commit: { message: "Refresh official data snapshots" } };
  };
  return { request, seen };
}

test("a first data proposal needs no pre-existing branch", async () => {
  const mock = requests(false);
  await guardDataProposal({ ...args, request: mock.request });
  assert.equal(mock.seen.length, 2);
});

test("an unchanged automated branch can receive a new candidate", async () => {
  await guardDataProposal({ ...args, request: requests(true).request });
});

test("human edits to the managed branch are preserved by stopping", async () => {
  await assert.rejects(guardDataProposal({ ...args, request: requests(true, "human").request }), /outside this automation/);
  await assert.rejects(guardDataProposal({ ...args, request: requests(true, "github-actions[bot]", "human").request }), /outside this automation/);
});

test("a concurrent main change requires a freshly checked candidate", async () => {
  await assert.rejects(guardDataProposal({ ...args, request: async () => ({ object: { sha: "c".repeat(40) } }) }), /main changed/);
});

test("API failures do not look like an absent proposal branch", async () => {
  await assert.rejects(guardDataProposal({ ...args, request: async () => { throw new Error("Forbidden"); } }), /Forbidden/);
});

test("repository and commit must be validated before any request", async () => {
  await assert.rejects(guardDataProposal({ ...args, repository: "../other", request: () => assert.fail("No API call expected") }), /Invalid/);
});

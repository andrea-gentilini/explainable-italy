import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const statusPath = ".github/data-refresh-status.json";
const outcomes = new Set(["success", "failure", "cancelled"]);
const commitPattern = /^[a-f0-9]{40}$/;
const checksumPattern = /^[a-f0-9]{64}$/;
const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validTimestamp(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value;
}

function validRunUrl(value) {
  return typeof value === "string"
    && /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/actions\/runs\/[1-9]\d*\/attempts\/[1-9]\d*$/.test(value);
}

function validProposalUrl(value) {
  return value === null || (typeof value === "string"
    && /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/pull\/[1-9]\d*$/.test(value));
}

function validChecksums(value) {
  return isObject(value) && Object.keys(value).length > 0
    && Object.entries(value).every(([code, hash]) => /^[a-z0-9_]+$/.test(code)
      && typeof hash === "string" && checksumPattern.test(hash));
}

function validatePreviousStatus(value) {
  if (value === null || value === undefined) return;
  const expectedKeys = ["schemaVersion", "attemptedAt", "outcome", "runUrl", "sourceCommit", "repositoryCommit", "proposalUrl", "lastSuccessfulCheck"];
  assert(isObject(value) && value.schemaVersion === 1
    && Object.keys(value).length === expectedKeys.length
    && expectedKeys.every((key) => Object.hasOwn(value, key)), "Invalid existing data-refresh status schema");
  assert(validTimestamp(value.attemptedAt) && outcomes.has(value.outcome)
    && validRunUrl(value.runUrl) && commitPattern.test(value.sourceCommit)
    && commitPattern.test(value.repositoryCommit) && validProposalUrl(value.proposalUrl), "Invalid existing data-refresh status context");
  const last = value.lastSuccessfulCheck;
  if (last !== null) {
    assert(isObject(last) && Object.keys(last).length === 3
      && validTimestamp(last.checkedAt) && commitPattern.test(last.sourceCommit)
      && validChecksums(last.datasets) && last.checkedAt <= value.attemptedAt,
    "Invalid existing successful-check record");
  }
  if (value.outcome === "success") {
    assert(last && last.checkedAt === value.attemptedAt && last.sourceCommit === value.sourceCommit,
      "Existing successful status does not match its successful-check record");
  }
}

function manifestChecksums(manifest) {
  assert(isObject(manifest) && Array.isArray(manifest.datasets) && manifest.datasets.length > 0,
    "A validated source manifest is required for a successful check");
  const pairs = manifest.datasets.map((dataset) => {
    assert(isObject(dataset) && /^[a-z0-9_]+$/.test(dataset.datasetCode)
      && typeof dataset.sha256 === "string" && checksumPattern.test(dataset.sha256), "Invalid source manifest checksum");
    return [dataset.datasetCode, dataset.sha256];
  });
  assert(new Set(pairs.map(([code]) => code)).size === pairs.length, "Duplicate source dataset in manifest");
  return Object.fromEntries(pairs.sort(([left], [right]) => left.localeCompare(right)));
}

/** Describe a completed attempt without treating a failed download as a successful check. */
export function buildRefreshStatus({ previous = null, outcome, attemptedAt, runUrl, sourceCommit, repositoryCommit = sourceCommit, manifest, proposalUrl = null }) {
  validatePreviousStatus(previous);
  assert(outcomes.has(outcome), "Invalid refresh outcome");
  assert(validTimestamp(attemptedAt), "Invalid refresh attempt time");
  assert(validRunUrl(runUrl), "Invalid GitHub Actions run URL");
  assert(typeof sourceCommit === "string" && commitPattern.test(sourceCommit), "Invalid source commit");
  assert(typeof repositoryCommit === "string" && commitPattern.test(repositoryCommit), "Invalid repository commit");
  assert(validProposalUrl(proposalUrl), "Invalid proposal URL");
  assert(!previous || attemptedAt >= previous.attemptedAt, "A stale attempt cannot replace a newer status");
  const lastSuccessfulCheck = outcome === "success" ? {
    checkedAt: attemptedAt,
    sourceCommit,
    datasets: manifestChecksums(manifest),
  } : previous?.lastSuccessfulCheck ? structuredClone(previous.lastSuccessfulCheck) : null;
  return {
    schemaVersion: 1,
    attemptedAt,
    outcome,
    runUrl,
    sourceCommit,
    repositoryCommit,
    proposalUrl,
    lastSuccessfulCheck,
  };
}

function githubRequest(token) {
  return async ({ method, path, body }) => {
    const response = await fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      const error = new Error(`GitHub status-record request failed (${response.status}, ${method})`);
      error.status = response.status;
      throw error;
    }
    return response.status === 204 ? null : response.json();
  };
}

function decodeStatusFile(file) {
  assert(isObject(file) && file.type === "file" && file.encoding === "base64"
    && typeof file.sha === "string" && commitPattern.test(file.sha)
    && typeof file.content === "string", "Invalid GitHub status-file response");
  const content = file.content.replace(/\s/g, "");
  assert(/^[A-Za-z0-9+/]*={0,2}$/.test(content)
    && Buffer.from(content, "base64").toString("base64") === content,
  "Invalid status-file encoding");
  let previous;
  try {
    previous = JSON.parse(Buffer.from(content, "base64").toString("utf8"));
  } catch {
    throw new Error("Existing data-refresh status is not valid JSON");
  }
  validatePreviousStatus(previous);
  assert(previous !== null, "Existing data-refresh status cannot be null");
  return previous;
}

/** Write only the audit file on main, retrying concurrent file updates with their latest history. */
export async function updateRefreshStatus({ repository, runId, runAttempt, sourceCommit, outcome, manifest, proposalUrl = null, attemptedAt = new Date().toISOString(), request }) {
  assert(typeof repository === "string" && repositoryPattern.test(repository)
    && !repository.split("/").some((part) => part === "." || part === ".."), "Invalid GitHub repository");
  assert(/^[1-9]\d*$/.test(String(runId)) && /^[1-9]\d*$/.test(String(runAttempt)), "Invalid GitHub run identity");
  assert(typeof request === "function", "A GitHub API request function is required");
  const runUrl = `https://github.com/${repository}/actions/runs/${runId}/attempts/${runAttempt}`;
  assert(proposalUrl === null || proposalUrl.startsWith(`https://github.com/${repository}/pull/`), "Proposal must belong to this repository");
  // Reject malformed new input before performing any remote write or reading old state.
  buildRefreshStatus({ outcome, attemptedAt, runUrl, sourceCommit, manifest, proposalUrl });
  const endpoint = `/repos/${repository}/contents/${statusPath}`;
  for (let attempt = 0; attempt <= 3; attempt++) {
    const main = await request({ method: "GET", path: `/repos/${repository}/git/ref/heads/main` });
    assert(main?.object?.type === "commit" && commitPattern.test(main.object.sha), "Invalid main-branch reference");
    let file = null;
    try {
      file = await request({ method: "GET", path: `${endpoint}?ref=main` });
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    const previous = file ? decodeStatusFile(file) : null;
    assert(!previous || previous.runUrl.startsWith(`https://github.com/${repository}/actions/runs/`), "Existing status belongs to another repository");
    if (previous && previous.attemptedAt > attemptedAt) {
      return { updated: false, status: previous };
    }
    const status = buildRefreshStatus({ previous, outcome, attemptedAt, runUrl, sourceCommit, repositoryCommit: main.object.sha, manifest, proposalUrl });
    const body = {
      message: `Record official data check: ${outcome}`,
      content: Buffer.from(`${JSON.stringify(status, null, 2)}\n`).toString("base64"),
      branch: "main",
      ...(file ? { sha: file.sha } : {}),
    };
    try {
      const result = await request({ method: "PUT", path: endpoint, body });
      return { updated: true, status, commit: result?.commit?.sha ?? null };
    } catch (error) {
      if (error.status !== 409 || attempt === 3) throw error;
    }
  }
  throw new Error("Could not update the data-refresh status");
}

async function main() {
  assert(process.env.GITHUB_ACTIONS === "true", "The status recorder runs only inside GitHub Actions");
  assert(process.env.GH_TOKEN, "GH_TOKEN is required");
  const outcome = process.env.REFRESH_RESULT;
  const manifest = outcome === "success"
    ? JSON.parse(await readFile(new URL("../data/manifest.json", import.meta.url), "utf8"))
    : undefined;
  const result = await updateRefreshStatus({
    repository: process.env.GITHUB_REPOSITORY,
    runId: process.env.GITHUB_RUN_ID,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT,
    sourceCommit: process.env.GITHUB_SHA,
    outcome,
    manifest,
    proposalUrl: process.env.PROPOSAL_URL || null,
    request: githubRequest(process.env.GH_TOKEN),
  });
  console.log(result.updated ? "Recorded the data-refresh attempt on GitHub." : "Kept a newer data-refresh record already on GitHub.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

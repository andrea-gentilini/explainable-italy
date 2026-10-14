import { pathToFileURL } from "node:url";

export const proposalBranch = "automation/data-refresh";

/** Stop rather than replace human edits or propose data checked against stale code. */
export async function guardDataProposal({ repository, sourceCommit, request }) {
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(repository) || !/^[a-f0-9]{40}$/.test(sourceCommit)) {
    throw new Error("Invalid repository or source commit");
  }
  const prefix = `/repos/${repository}`;
  const main = await request(`${prefix}/git/ref/heads/main`);
  if (main.object.sha !== sourceCommit) {
    throw new Error("main changed while the candidate was being checked. Run the refresh again against the new edition.");
  }
  const branch = await request(`${prefix}/git/ref/heads/${proposalBranch}`, { allowMissing: true });
  if (!branch) return;
  const head = await request(`${prefix}/commits/${branch.object.sha}`);
  if (head.committer?.login !== "github-actions[bot]" || head.author?.login !== "github-actions[bot]"
      || head.commit.message.split("\n")[0] !== "Refresh official data snapshots") {
    throw new Error("The managed data branch contains work outside this automation. Review it before running another refresh.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const token = process.env.GH_TOKEN;
  if (!token || process.env.GITHUB_ACTIONS !== "true") throw new Error("This guard runs inside GitHub Actions with its temporary token");
  await guardDataProposal({
    repository: process.env.GITHUB_REPOSITORY,
    sourceCommit: process.env.GITHUB_SHA,
    request: async (path, { allowMissing = false } = {}) => {
      const response = await fetch(`https://api.github.com${path}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
        signal: AbortSignal.timeout(30_000),
      });
      if (allowMissing && response.status === 404) return null;
      if (!response.ok) throw new Error(`GitHub proposal guard failed: HTTP ${response.status}`);
      return response.json();
    },
  });
}

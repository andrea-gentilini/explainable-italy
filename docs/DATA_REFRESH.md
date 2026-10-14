# Updating the official data

Explainable Italy publishes a checked copy of its official sources. The website reads the committed snapshots, so a source revision reaches the site only after a reviewed data update is merged.

The [Propose a data refresh workflow](../.github/workflows/refresh-data.yml) checks the sources every **Tuesday at 05:23 UTC**. In Rome and Madrid this is 07:23 during summer time and 06:23 during winter time. It can also be started manually from [GitHub Actions](https://github.com/andrea-gentilini/explainable-italy/actions/workflows/refresh-data.yml), using **Run workflow** on `main`.

## What a check does

1. Downloads the exact official selections used by the project and validates the candidate snapshots.
2. Compares them with the published data. The report covers new and removed years, revisions to historical observations, individual countries, quality flags, coverage, source metadata and raw-file checksums.
3. Runs the complete `pnpm check` suite and the production-dependency security audit.
4. Opens or updates one draft pull request on `automation/data-refresh` when a substantive difference is found. The proposal contains the change report and the verified candidate data.
5. Records the result on `main` in [`.github/data-refresh-status.json`](../.github/data-refresh-status.json).

A change to the download time or build time alone does not create a data proposal. The comparison ignores only `accessedAt` and `generatedAt`. Official source update dates, source selections and raw snapshot checksums remain significant, even when the displayed numbers are unchanged.

The candidate and its JSON and Markdown reports are retained as the `verified-data-refresh` Actions artifact for **14 days**. A completed run also shows the report in its summary.

## Review and publication

Data proposals remain drafts and are never merged automatically. Check the official definitions and notes for the affected datasets, including units, populations, methodological breaks and the interpretation of provisional values. Inspect historical revisions as well as new observations. Update the site explanations when the source changes what a number means.

The refresh workflow runs the full checks before preparing a proposal. GitHub may require a maintainer to approve separate checks on a bot-created pull request. Confirm their state and the refresh run before marking the proposal ready and merging it. Merging the reviewed data through the normal GitHub process triggers the site's verification and deployment workflow.

The branch `automation/data-refresh` is reserved for the workflow. If its latest commit was made by someone other than `github-actions[bot]`, the workflow stops rather than replacing that work. Make manual corrections in a separate branch or preserve them before resuming automated updates. The workflow also checks for concurrent changes to `main` before preparing a proposal.

## Runs during quiet periods

Each attempt records a small audit entry with its time, result, workflow-run link and source commit. A successful check also records the official snapshot checksums. If a later attempt fails, the record keeps the details of the last successful check. These are useful records of source checks, including checks that find no new data.

The audit updates create regular repository activity even when no one changes the application for months. This addresses GitHub's automatic suspension of scheduled workflows after 60 days without repository activity. The audit commits use the workflow's temporary `GITHUB_TOKEN`, so they do not recursively start another workflow or redeploy the site.

GitHub schedules are best effort. A run can start late or be skipped, and an outage or a permissions problem can prevent both the check and its audit entry. The schedule is therefore not a guarantee of a particular publication date. The [Actions history](https://github.com/andrea-gentilini/explainable-italy/actions/workflows/refresh-data.yml) shows failures. Compare the latest attempt and successful-check dates in the status file when checking that the automation is still running. If a workflow has been disabled, re-enable it in Actions and run it manually once.

## Where it runs

Everything runs on temporary GitHub-hosted runners. No background service, scheduled task or permanent process is installed on a personal computer. A local checkout is only needed for development and can be deleted without stopping the website or the refresh schedule.

The refresh workflow pins external actions to commit hashes and installs the locked dependency versions. The download and validation job has read-only repository access. Only the proposal and audit-record jobs receive the write permissions they need. Authentication uses GitHub's short-lived workflow token, with no personal access token to store or renew. Repository settings must allow GitHub Actions to create pull requests.

## Reproduce a comparison locally

From a development checkout with the dependencies installed:

```sh
pnpm data:update
node scripts/data-refresh-report.mjs --base HEAD
pnpm check
pnpm audit --prod --audit-level=high
```

The report is written to `.data-refresh/report.json` and `.data-refresh/report.md`. Use `--base <commit>` to compare with a particular committed edition. Report generation does not edit the data or their acquisition dates. The acquisition command updates the local candidate files, so review the resulting diff before committing them.

import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { publishDataFiles } from "../scripts/data-publish.mjs";

test("candidate validation precedes publication and cleans staged files on failure", async () => {
  const root = await mkdtemp(join(tmpdir(), "explainable-data-test-"));
  try {
    const target = join(root, "dataset.json");
    await writeFile(target, "old");
    await assert.rejects(publishDataFiles(new Map([[target, "new"]]), {
      root,
      validate: async (candidate) => {
        assert.equal(await readFile(join(candidate, "dataset.json"), "utf8"), "new");
        assert.equal(await readFile(target, "utf8"), "old");
        throw new Error("Rejected candidate");
      },
    }), /Rejected candidate/);
    assert.equal(await readFile(target, "utf8"), "old");
    assert.deepEqual(await readdir(root), ["dataset.json"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("successful validation publishes the complete candidate", async () => {
  const root = await mkdtemp(join(tmpdir(), "explainable-data-test-"));
  try {
    const files = new Map([[join(root, "one.json"), "one"], [join(root, "public/two.csv"), "two"]]);
    await publishDataFiles(files, { root, validate: async () => {} });
    for (const [path, content] of files) assert.equal(await readFile(path, "utf8"), content);
    assert(!(await readdir(root)).some((name) => name.startsWith(".data-update-")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("an I/O failure after replacement restores earlier data", async () => {
  const root = await mkdtemp(join(tmpdir(), "explainable-data-test-"));
  try {
    const first = join(root, "first.json");
    const second = join(root, "second.json");
    await writeFile(first, "original");
    await writeFile(second, "previous second");
    const files = new Map([[first, "replacement"], [second, "new"]]);
    let replacements = 0;
    await assert.rejects(publishDataFiles(files, {
      root,
      validate: async () => {},
      replaceFile: async (source, destination) => {
        if (++replacements === 2) throw new Error("Injected I/O failure");
        await rename(source, destination);
      },
    }), { message: "Injected I/O failure" });
    assert.equal(replacements, 2);
    assert.equal(await readFile(second, "utf8"), "previous second");
    assert.equal(await readFile(first, "utf8"), "original");
    assert(!(await readdir(root)).some((name) => name.startsWith(".data-update-")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

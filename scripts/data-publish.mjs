import { copyFile, mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative } from "node:path";

/** Validate a complete candidate before replacing files; roll back normal I/O failures. */
export async function publishDataFiles(files, { root, validate, replaceFile = rename }) {
  const staging = await mkdtemp(join(root, ".data-update-"));
  const candidate = join(staging, "candidate");
  const backup = join(staging, "backup");
  const entries = [];
  const published = [];
  let preserveRecoveryFiles = false;
  try {
    for (const [destination, content] of files) {
      const path = relative(root, destination);
      if (!path || path.startsWith("..") || isAbsolute(path)) {
        throw new Error(`Data output must remain inside the project: ${path}`);
      }
      const staged = join(candidate, path);
      await mkdir(dirname(staged), { recursive: true });
      await writeFile(staged, content);
      entries.push({ destination, staged, saved: join(backup, path), existed: false });
    }
    await validate(candidate);
    // Save every previous file before committing the first replacement.
    for (const entry of entries) {
      await mkdir(dirname(entry.saved), { recursive: true });
      try {
        await copyFile(entry.destination, entry.saved);
        entry.existed = true;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    for (const entry of entries) {
      await mkdir(dirname(entry.destination), { recursive: true });
      await replaceFile(entry.staged, entry.destination);
      published.push(entry);
    }
  } catch (error) {
    const recoveryErrors = [];
    for (const entry of published.reverse()) {
      try {
        if (entry.existed) await rename(entry.saved, entry.destination);
        else await rm(entry.destination, { force: true });
      } catch (recoveryError) {
        recoveryErrors.push(recoveryError);
      }
    }
    if (recoveryErrors.length) {
      preserveRecoveryFiles = true;
      throw new AggregateError([error, ...recoveryErrors], `Data recovery incomplete; backups retained at ${backup}`);
    }
    throw error;
  } finally {
    if (!preserveRecoveryFiles) await rm(staging, { recursive: true, force: true });
  }
}

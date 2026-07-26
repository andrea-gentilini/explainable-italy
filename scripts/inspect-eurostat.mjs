import { readFile } from "node:fs/promises";

const filePath = process.argv[2];

if (!filePath) {
  throw new Error("Pass the path to a Eurostat JSON-stat file.");
}

const dataset = JSON.parse(await readFile(filePath, "utf8"));

console.log(`${dataset.extension?.id ?? "dataset"}: ${dataset.label}`);
console.log(`Updated: ${dataset.updated ?? "unknown"}`);

for (const dimensionId of dataset.id ?? []) {
  const dimension = dataset.dimension[dimensionId];
  const entries = Object.entries(dimension.category.index)
    .sort((a, b) => a[1] - b[1])
    .map(([code]) => `${code}=${dimension.category.label?.[code] ?? code}`);

  console.log(`\n${dimensionId} (${entries.length})`);
  console.log(entries.slice(0, 120).join(" | "));
}

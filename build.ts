import { Glob } from "bun";

const glob = new Glob("src/**/*.ts");
const entrypoints: string[] = [];
const ignoreFiles = ["build.ts", "example.ts"];

const isTestFile = (file: string) =>
  !file.endsWith(".test.ts") && !file.endsWith(".spec.ts");

for await (const file of glob.scan()) {
  // テストファイルを除外して追加
  if (!isTestFile(file) && !ignoreFiles.includes(file)) {
    entrypoints.push(file);
  }
}

await Bun.build({
  entrypoints: entrypoints,
  outdir: "./dist",
});

console.log(`✨ ${entrypoints.length} 個のファイルをビルドしました。`);

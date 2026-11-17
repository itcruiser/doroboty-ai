import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const [mode, argument] = process.argv.slice(2);
assert.ok(
  ["prepare", "check"].includes(mode),
  "Use prepare or check and an absolute archive path.",
);
assert.ok(
  argument && path.isAbsolute(argument),
  "Provide an absolute archive path outside the repository.",
);
const root = process.cwd();
const archive = path.resolve(argument);
const relative = path.relative(root, archive);
assert.ok(
  relative === ".." || relative.startsWith(`..${path.sep}`),
  "Archive must be outside the repository.",
);
assert.ok(!root.startsWith(archive + path.sep), "Archive cannot be an ancestor of the repository.");

function inventory(folder) {
  const result = {};
  function visit(current, prefix = "") {
    for (const entry of fs
      .readdirSync(current, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const name = prefix + entry.name;
      const file = path.join(current, entry.name);
      assert.ok(!entry.isSymbolicLink(), "Release files cannot be symbolic links.");
      if (entry.isDirectory()) visit(file, name + "/");
      else {
        assert.ok(entry.isFile(), "Only regular files are allowed.");
        result[name] = createHash("sha256").update(fs.readFileSync(file)).digest("hex");
      }
    }
  }
  visit(folder);
  return result;
}
if (mode === "prepare") {
  const dist = path.join(root, "dist");
  const build = JSON.parse(fs.readFileSync(path.join(dist, "version.json"), "utf8"));
  assert.ok(
    build.id && build.revision && build.builtAt,
    "Build identity is required; run npm run build first.",
  );
  assert.ok(
    !fs.existsSync(archive) || fs.readdirSync(archive).length === 0,
    "Archive must be empty; no existing release is replaced.",
  );
  const files = inventory(dist);
  assert.ok(files["index.html"] && files["version.json"], "Incomplete static build.");
  fs.mkdirSync(archive, { recursive: true });
  fs.cpSync(dist, path.join(archive, "dist"), { recursive: true });
  fs.writeFileSync(
    path.join(archive, "release.json"),
    JSON.stringify({ schema: 1, build, files }, null, 2) + "\n",
  );
}
const manifest = JSON.parse(fs.readFileSync(path.join(archive, "release.json"), "utf8"));
assert.equal(manifest.schema, 1);
assert.deepEqual(inventory(path.join(archive, "dist")), manifest.files);
assert.deepEqual(
  JSON.parse(fs.readFileSync(path.join(archive, "dist/version.json"), "utf8")),
  manifest.build,
);
console.log(
  `Release ${manifest.build.id}: ${Object.keys(manifest.files).length} files verified. Archive: ${archive}`,
);

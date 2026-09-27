// Converts a folder of photos into web-ready WebP files (max 1400px on the long edge,
// metadata such as camera/location stripped) and prints the YAML list to paste into
// content/story/section-06.md.
//
//   npm run photos -- "source-media/PHOTOS SPORTS" sports
//     → public/images/sports/01.webp, 02.webp, ...
//
// Files are processed in name order (1.jpg, 2.jpg, ...). To reorder or remove photos on
// the site later, just edit the list in section-06.md; no need to re-run this.

import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const [srcArg, nameArg] = process.argv.slice(2);
if (!srcArg || !nameArg) {
  console.error('Usage: npm run photos -- "<source folder>" <output name>');
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "..");
const src = path.resolve(root, srcArg);
const outDir = path.join(root, "public/images", nameArg);
mkdirSync(outDir, { recursive: true });

const files = readdirSync(src)
  .filter((f) => /\.(jpe?g|png|webp|heic|tiff?)$/i.test(f))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const lines = [];
files.forEach((file, i) => {
  const out = `${String(i + 1).padStart(2, "0")}.webp`;
  const r = spawnSync(ffmpeg, [
    "-v", "error", "-y", "-i", path.join(src, file),
    "-vf", "scale='min(1400,iw)':'min(1400,ih)':force_original_aspect_ratio=decrease",
    "-map_metadata", "-1", "-c:v", "libwebp", "-quality", "82",
    path.join(outDir, out),
  ]);
  if (r.status !== 0) throw new Error(`Failed on ${file}: ${r.stderr}`);
  lines.push(`      - src: /images/${nameArg}/${out}   # from ${file}`, `        alt: ""`);
});

console.log(`Wrote ${files.length} photos to public/images/${nameArg}/\n\nphotos:\n${lines.join("\n")}`);

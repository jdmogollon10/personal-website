// Turns the master videos into web-ready image sequences for scroll scrubbing.
//
//   npm run frames                 (both sets)
//   npm run frames -- desktop      (just one set)
//   npm run frames -- mobile
//
// Outputs:
//   public/frames/desktop/0001.webp ...  16:9 frames from the desktop video
//   public/frames/mobile/0001.webp  ...  9:16 frames from the mobile video
//   public/frames/manifest.json          fps, frame count, sizes (read by the site)
//
// Both videos must share the same timing: the site uses one set of stop timestamps.

import { spawn } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const FPS = 24;
const QUALITY = 72;

const SETS = {
  desktop: { source: "source-media/Final video V3.mp4", width: 1920, height: 1080 },
  mobile: { source: "source-media/mobile version.mp4", width: 900, height: 1600 },
};

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "public/frames");
const only = process.argv[2];
const names = only ? [only] : Object.keys(SETS);

function extract(name) {
  const { source, width, height } = SETS[name];
  const dir = path.join(outDir, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const args = [
    "-hide_banner", "-loglevel", "error", "-stats", "-y",
    "-i", path.join(root, source),
    "-vf", `fps=${FPS},scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${width}:${height}`,
    "-c:v", "libwebp", "-quality", String(QUALITY), "-compression_level", "6",
    path.join(dir, "%04d.webp"),
  ];

  console.log(`Extracting ${name} frames from ${source} at ${FPS}fps...`);
  return new Promise((resolve, reject) => {
    spawn(ffmpeg, args, { stdio: "inherit" }).on("exit", (code) =>
      code === 0 ? resolve(readdirSync(dir).filter((f) => f.endsWith(".webp")).length) : reject(new Error(`ffmpeg exited ${code}`)),
    );
  });
}

for (const name of names) {
  if (!SETS[name]) throw new Error(`Unknown set "${name}" (expected ${Object.keys(SETS).join(" or ")})`);
  const count = await extract(name);
  console.log(`  ${name}: ${count} frames`);
}

const counts = Object.keys(SETS).map((n) => readdirSync(path.join(outDir, n)).filter((f) => f.endsWith(".webp")).length);
const count = Math.min(...counts);
const manifest = {
  fps: FPS,
  count,
  duration: count / FPS,
  sets: Object.fromEntries(
    Object.entries(SETS).map(([n, s]) => [n, { path: `/frames/${n}`, width: s.width, height: s.height }]),
  ),
};
writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Done: ${count} frames (${manifest.duration.toFixed(2)}s)`);

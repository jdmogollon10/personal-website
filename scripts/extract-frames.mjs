// Turns the master video into web-ready image sequences for scroll scrubbing.
//
//   npm run frames                       (uses source-media/FINAL V2.mp4)
//   npm run frames -- path/to/video.mp4
//
// Outputs:
//   public/frames/desktop/0001.webp ...  full 16:9 frames, 1920px wide
//   public/frames/mobile/0001.webp  ...  center-cropped 3:4 frames for phones
//   public/frames/manifest.json          fps, frame count, sizes (read by the site)

import { spawn } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const FPS = 24;
const QUALITY = 72;
const DESKTOP_WIDTH = 1920;
const MOBILE = { width: 900, height: 1200 };

const root = path.resolve(import.meta.dirname, "..");
const input = path.resolve(root, process.argv[2] ?? "source-media/FINAL V2.mp4");
const outDir = path.join(root, "public/frames");
const desktopDir = path.join(outDir, "desktop");
const mobileDir = path.join(outDir, "mobile");

for (const dir of [desktopDir, mobileDir]) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

// Decode once, split into two outputs.
const filter = [
  `[0:v]fps=${FPS},split=2[a][b]`,
  `[a]scale=${DESKTOP_WIDTH}:-2:flags=lanczos[desk]`,
  `[b]crop=ih*3/4:ih,scale=${MOBILE.width}:${MOBILE.height}:flags=lanczos[mob]`,
].join(";");

const args = [
  "-hide_banner", "-loglevel", "error", "-stats", "-y",
  "-i", input,
  "-filter_complex", filter,
  "-map", "[desk]", "-c:v", "libwebp", "-quality", String(QUALITY), "-compression_level", "6",
  path.join(desktopDir, "%04d.webp"),
  "-map", "[mob]", "-c:v", "libwebp", "-quality", String(QUALITY), "-compression_level", "6",
  path.join(mobileDir, "%04d.webp"),
];

console.log(`Extracting frames from ${path.relative(root, input)} at ${FPS}fps...`);
const proc = spawn(ffmpeg, args, { stdio: "inherit" });
proc.on("exit", (code) => {
  if (code !== 0) process.exit(code ?? 1);
  const count = readdirSync(desktopDir).filter((f) => f.endsWith(".webp")).length;
  const manifest = {
    fps: FPS,
    count,
    duration: count / FPS,
    sets: {
      desktop: { path: "/frames/desktop", width: DESKTOP_WIDTH, height: Math.round((DESKTOP_WIDTH * 9) / 16) },
      mobile: { path: "/frames/mobile", width: MOBILE.width, height: MOBILE.height },
    },
  };
  writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Done: ${count} frames (${manifest.duration.toFixed(2)}s)`);
});

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const CONTENT = path.join(process.cwd(), "content");

export type LinkItem = { label: string; href: string; note?: string; tag?: string };

export type Site = {
  name: string;
  title: string;
  description: string;
  email?: string;
  socials: LinkItem[];
};

export type MapItemId = "venezuela" | "creative" | "entrepreneurship" | "interests" | "sports";

export type MapProject = {
  title: string;
  subtitle?: string;
  image?: string;
  imageAlt?: string;
  facts?: string[];
  html: string;
};

export type MapItem = {
  label: string;
  title?: string;
  html: string; // story / caption, markdown → html
  list?: { title: string; html: string }[]; // e.g. My Creative Side
  activities?: string[]; // Sports
  photos?: { src: string; alt: string }[]; // Sports carousel, in display order
  projects?: MapProject[]; // Entrepreneurship
  tags?: string[]; // small technical details (Interests)
  visual?: "payoff"; // decorative sketch shown with the story
};

export type MapContent = {
  hometown: { lat: number; lon: number; label: string };
  destination: { label: string };
  intro?: { heading: string; text: string };
  items: Record<MapItemId, MapItem>;
};

export type StoryContent = {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  html: string;
  links: LinkItem[];
  map?: MapContent;
};

const MAP_IDS: MapItemId[] = ["venezuela", "creative", "entrepreneurship", "interests", "sports"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseMap(raw: any): MapContent | undefined {
  if (!raw) return undefined;
  const items = Object.fromEntries(
    MAP_IDS.map((id) => {
      const it = raw.items?.[id] ?? {};
      const item: MapItem = { label: it.label ?? id, title: it.title, html: md(String(it.body ?? it.caption ?? "")) };
      if (Array.isArray(it.list))
        item.list = it.list.map((l: { title?: string; body?: string } | string) =>
          typeof l === "string" ? { title: l, html: "" } : { title: l.title ?? "", html: l.body ? md(l.body) : "" },
        );
      if (Array.isArray(it.activities)) item.activities = it.activities.map(String);
      if (Array.isArray(it.tags)) item.tags = it.tags.map(String);
      if (it.visual === "payoff") item.visual = "payoff";
      if (Array.isArray(it.photos))
        item.photos = it.photos.filter((ph: { src?: string }) => ph?.src).map((ph: { src: string; alt?: string }) => ({ src: ph.src, alt: ph.alt ?? "" }));
      if (Array.isArray(it.projects))
        item.projects = it.projects.map(
          (p: { title?: string; subtitle?: string; image?: string; imageAlt?: string; facts?: unknown[]; body?: string }) => ({
            title: p.title ?? "",
            subtitle: p.subtitle,
            image: p.image || undefined,
            imageAlt: p.imageAlt ?? "",
            facts: Array.isArray(p.facts) ? p.facts.map(String) : undefined,
            html: md(String(p.body ?? "")),
          }),
        );
      return [id, item];
    }),
  ) as Record<MapItemId, MapItem>;
  return {
    hometown: { lat: Number(raw.hometown?.lat ?? 7), lon: Number(raw.hometown?.lon ?? -66), label: raw.hometown?.label ?? "" },
    destination: { label: raw.destination?.label ?? "Miami" },
    intro: raw.intro?.heading ? { heading: String(raw.intro.heading), text: String(raw.intro.text ?? "") } : undefined,
    items,
  };
}

export type MoreSection =
  | { id: string; type: "text"; eyebrow?: string; title: string; html: string }
  | { id: string; type: "links"; eyebrow?: string; title: string; html: string; items: LinkItem[] }
  | { id: string; type: "contact"; eyebrow?: string; title: string; html: string };

export type FrameManifest = {
  fps: number;
  count: number;
  duration: number;
  sets: Record<"desktop" | "mobile", { path: string; width: number; height: number }>;
};

function readDir(dir: string) {
  const full = path.join(CONTENT, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => ({ id: f.replace(/\.md$/, ""), ...matter(readFileSync(path.join(full, f), "utf8")) }));
}

const md = (s: string) => marked.parse(s.trim(), { async: false });

export function getSite(): Site {
  const { data } = matter(readFileSync(path.join(CONTENT, "site.md"), "utf8"));
  return {
    name: data.name ?? "",
    title: data.title ?? data.name ?? "",
    description: data.description ?? "",
    email: data.email,
    socials: data.socials ?? [],
  };
}

/** Text for each story stop, keyed by section id (content/story/<id>.md). */
export function getStoryContent(): Record<string, StoryContent> {
  return Object.fromEntries(
    readDir("story").map(({ id, data, content }) => [
      id,
      {
        id,
        eyebrow: data.eyebrow,
        title: data.title ?? "",
        subtitle: data.subtitle,
        html: md(content),
        links: data.links ?? [],
        map: parseMap(data.map),
      },
    ]),
  );
}

export function getMoreSections(): MoreSection[] {
  return readDir("more").map(({ id, data, content }) => {
    const base = { id, eyebrow: data.eyebrow, title: data.title ?? "", html: md(content) };
    if (data.type === "links") return { ...base, type: "links", items: data.items ?? [] };
    if (data.type === "contact") return { ...base, type: "contact" };
    return { ...base, type: "text" };
  });
}

export function getFrameManifest(): FrameManifest | null {
  const file = path.join(process.cwd(), "public/frames/manifest.json");
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
}

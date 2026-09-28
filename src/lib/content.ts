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

export type MapItemId = "venezuela" | "creative" | "entrepreneurship" | "investing" | "interests" | "sports";

export type MapProject = {
  title: string;
  tab?: string; // short name on the project's tab
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
  list?: { title: string; html: string; icon?: string }[]; // Creative entries, Interests tiles
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

/** A small label placed around a stop's scene (see content/story/section-14.md). */
export type SceneLabel = { text: string; at: string; style?: "feature" | "quiet" };

export type StoryContent = {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  html: string;
  links: LinkItem[];
  map?: MapContent;
  labels: SceneLabel[];
  photos: { src: string; alt: string }[]; // photo carousel under the text
  photosTitle?: string;
  photosButton?: string; // short caption on the phone "photos" button
  lead?: string; // opening line under the title (step layout)
  steps: { title: string; html: string; org?: string }[]; // revealed one per scroll
  previews: { label: string; items: string[] }[]; // small "coming up" groups under the text
  projects: ShowcaseProject[]; // projects shown one at a time, switched with tabs
  topics: { title: string; html: string }[]; // one per scroll step; headings also switch
};

export type ShowcaseProject = {
  title: string;
  tab: string;
  html: string;
  image?: string;
  imageAlt: string;
  href?: string; // opens in a new tab (from the image and the button)
  button: string;
  workflow?: Workflow; // shown as a native diagram; the button opens the full sequence
};

export type WorkflowItem = { kind: "input" | "step" | "file"; num?: string; label: string; text: string };
export type Workflow = { title: string; stages: { name: string; items: WorkflowItem[] }[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseWorkflow(raw: any): Workflow | undefined {
  if (!raw || !Array.isArray(raw.stages)) return undefined;
  return {
    title: String(raw.title ?? ""),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stages: raw.stages.map((st: any) => ({
      name: String(st.name ?? ""),
      items: Array.isArray(st.items)
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          st.items.map((it: any) => ({
            kind: it.kind === "input" || it.kind === "file" ? it.kind : "step",
            num: it.num !== undefined ? String(it.num) : undefined,
            label: String(it.label ?? ""),
            text: String(it.text ?? ""),
          }))
        : [],
    })),
  };
}

const MAP_IDS: MapItemId[] = ["venezuela", "creative", "entrepreneurship", "investing", "interests", "sports"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseMap(raw: any): MapContent | undefined {
  if (!raw) return undefined;
  const items = Object.fromEntries(
    MAP_IDS.map((id) => {
      const it = raw.items?.[id] ?? {};
      const item: MapItem = { label: it.label ?? id, title: it.title, html: md(String(it.body ?? it.caption ?? "")) };
      if (Array.isArray(it.list))
        item.list = it.list.map((l: { title?: string; body?: string; icon?: string } | string) =>
          typeof l === "string" ? { title: l, html: "" } : { title: l.title ?? "", html: l.body ? md(l.body) : "", icon: l.icon },
        );
      if (Array.isArray(it.activities)) item.activities = it.activities.map(String);
      if (Array.isArray(it.tags)) item.tags = it.tags.map(String);
      if (it.visual === "payoff") item.visual = "payoff";
      if (Array.isArray(it.photos))
        item.photos = it.photos.filter((ph: { src?: string }) => ph?.src).map((ph: { src: string; alt?: string }) => ({ src: ph.src, alt: ph.alt ?? "" }));
      if (Array.isArray(it.projects))
        item.projects = it.projects.map(
          (p: { title?: string; tab?: string; subtitle?: string; image?: string; imageAlt?: string; facts?: unknown[]; body?: string }) => ({
            title: p.title ?? "",
            tab: p.tab,
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

/** A card in the "work" index: a project inside a scroll stop (`project` is 1-based). */
export type WorkRef = { stop: string; project: number; title?: string };

export type MoreSection =
  | { id: string; type: "text"; eyebrow?: string; title: string; html: string }
  | { id: string; type: "links"; eyebrow?: string; title: string; html: string; items: LinkItem[] }
  | { id: string; type: "work"; eyebrow?: string; title: string; html: string; items: WorkRef[] }
  | { id: string; type: "about"; eyebrow?: string; title: string; html: string; image?: string; imageAlt: string }
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
        labels: Array.isArray(data.labels)
          ? data.labels
              .filter((l: { text?: string }) => l?.text)
              .map((l: { text: string; at?: string; style?: string }) => ({
                text: String(l.text),
                at: String(l.at ?? "default"),
                style: l.style === "feature" || l.style === "quiet" ? l.style : undefined,
              }))
          : [],
        photos: Array.isArray(data.photos)
          ? data.photos.filter((ph: { src?: string }) => ph?.src).map((ph: { src: string; alt?: string }) => ({ src: ph.src, alt: ph.alt ?? "" }))
          : [],
        topics: Array.isArray(data.topics)
          ? data.topics.map((t: { title?: string; body?: string }) => ({ title: t.title ?? "", html: md(String(t.body ?? "")) }))
          : [],
        projects: Array.isArray(data.projects)
          ? data.projects.map(
              (pr: {
                title?: string;
                tab?: string;
                body?: string;
                image?: string;
                imageAlt?: string;
                href?: string;
                button?: string;
                workflow?: unknown;
              }) => ({
                title: pr.title ?? "",
                tab: pr.tab ?? pr.title ?? "",
                html: md(String(pr.body ?? "")),
                image: pr.image || undefined,
                imageAlt: pr.imageAlt ?? "",
                href: pr.href || undefined,
                button: pr.button ?? "Open",
                workflow: parseWorkflow(pr.workflow),
              }),
            )
          : [],
        previews: Array.isArray(data.previews)
          ? data.previews.map((pv: { label?: string; items?: unknown[] }) => ({
              label: pv.label ?? "",
              items: Array.isArray(pv.items) ? pv.items.map(String) : [],
            }))
          : [],
        photosTitle: data.photosTitle,
        photosButton: data.photosButton,
        lead: data.lead,
        steps: Array.isArray(data.steps)
          ? data.steps.map((st: { title?: string; body?: string; org?: string }) => ({
              title: st.title ?? "",
              html: md(String(st.body ?? "")),
              org: st.org,
            }))
          : [],
      },
    ]),
  );
}

export function getMoreSections(): MoreSection[] {
  return readDir("more").map(({ id, data, content }) => {
    const base = { id, eyebrow: data.eyebrow, title: data.title ?? "", html: md(content) };
    if (data.type === "links") return { ...base, type: "links", items: data.items ?? [] };
    if (data.type === "work")
      return {
        ...base,
        type: "work",
        items: (data.items ?? []).map((it: { stop?: string; project?: number; title?: string }) => ({
          stop: String(it.stop ?? ""),
          project: Number(it.project ?? 1),
          title: it.title,
        })),
      };
    if (data.type === "about") return { ...base, type: "about", image: data.image, imageAlt: data.imageAlt ?? "" };
    if (data.type === "contact") return { ...base, type: "contact" };
    return { ...base, type: "text" };
  });
}

export function getFrameManifest(): FrameManifest | null {
  const file = path.join(process.cwd(), "public/frames/manifest.json");
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
}

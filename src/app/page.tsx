import ScrollStory from "@/components/ScrollStory";
import MoreSections from "@/components/MoreSections";
import { getFrameManifest, getMoreSections, getSite, getStoryContent } from "@/lib/content";

export default function Home() {
  const manifest = getFrameManifest();
  const story = getStoryContent();

  return (
    <main>
      {manifest ? (
        <ScrollStory content={story} manifest={manifest} />
      ) : (
        <p className="missing-frames">
          Run <code>npm run frames</code> to generate the video frames.
        </p>
      )}
      <MoreSections sections={getMoreSections()} site={getSite()} story={story} />
    </main>
  );
}

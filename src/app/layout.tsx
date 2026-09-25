import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import { getSite } from "@/lib/content";
import "./globals.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export function generateMetadata(): Metadata {
  const site = getSite();
  return { title: site.title, description: site.description };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} antialiased`}>
      <head>
        <link rel="preload" as="image" href="/frames/desktop/0001.webp" media="(min-aspect-ratio: 9/10)" />
        <link rel="preload" as="image" href="/frames/mobile/0001.webp" media="(max-aspect-ratio: 9/10)" />
      </head>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Analytics } from "@/components/Analytics";
import "@/home/home.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.rohanpant.com"),
  title: "Rohan Pant, AI/ML Engineer",
  description:
    "Rohan Pant, AI/ML engineer. Agentic AI systems, RAG pipelines and LLM evaluation. Open to internships and full-time roles.",
  icons: { icon: "/assets/favicon.svg" },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Rohan Pant, AI/ML Engineer",
    description:
      "Projects, experience and a small 3D me who answers your questions by showing you around the page.",
    type: "website",
    url: "https://www.rohanpant.com",
    siteName: "Rohan Pant",
  },
};

export const viewport: Viewport = {
  themeColor: "#E7E8E3",
};

/** Root layout for the home page. */
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/anybody.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/schibsted-grotesk.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Mascot } from "@/components/Mascot";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.rohanpant.com"),
  title: "Ask Rohan - Rohan Pant, AI / ML Engineer",
  description:
    "Chat with an AI assistant about Rohan Pant, an AI / ML Engineer building agentic AI systems, RAG pipelines, and LLM-integrated backends. Open to AI, ML, and SWE internships.",
  icons: { icon: "/assets/favicon.svg" },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Ask Rohan - Rohan Pant",
    description:
      "Chat with an AI version of Rohan Pant: projects, experience, skills, and contact.",
    type: "website",
    url: "https://www.rohanpant.com",
    siteName: "Ask Rohan",
  },
};

// Runs before paint to stamp the saved theme on <html>, avoiding a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('ask-rohan-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
        <Mascot />
        <Analytics />
      </body>
    </html>
  );
}

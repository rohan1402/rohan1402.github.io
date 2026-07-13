import { ChatApp } from "@/components/ChatApp";
import { ROHAN } from "@/data/rohan";

export default function Home() {
  return (
    <>
      {/* Server-rendered, screen-reader / crawler friendly heading. */}
      <h1 className="sr-only">
        {ROHAN.name}, {ROHAN.title}. {ROHAN.tagline}
      </h1>
      <ChatApp />
    </>
  );
}

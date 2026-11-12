import type { Metadata } from "next";
import { ChatApp } from "@/components/ChatApp";

export const metadata: Metadata = {
  alternates: { canonical: "/chat" },
};

/** /chat: the full-screen chat, kept alongside the new home page. */
export default function ChatPage() {
  return <ChatApp />;
}

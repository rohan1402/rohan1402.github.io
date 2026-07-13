"use client";

import { useState } from "react";

/**
 * BotAvatar: Rohan's round avatar. If the image fails to load it falls back to
 * the letter "R", matching the original onerror behaviour.
 */
export function BotAvatar({ sm = false }: { sm?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={sm ? "avatar sm" : "avatar"}>
      {failed ? (
        "R"
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/assets/rohan-avatar.jpg"
          alt="Rohan"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

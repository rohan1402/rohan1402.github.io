"use client";

import { useState } from "react";

/**
 * The AI twin's 3D avatar. Expression frames live in /assets/avatar and map to
 * chat states (thinking while the model works, talking while streaming, oops on
 * fallback, and so on). Falls back to the letter "R" if the image fails.
 */

export type Expression =
  | "neutral"
  | "thinking"
  | "talking"
  | "listening"
  | "dozing"
  | "oops";

export const EXPRESSIONS: Expression[] = [
  "neutral",
  "thinking",
  "talking",
  "listening",
  "dozing",
  "oops",
];

export function avatarSrc(expression: Expression): string {
  return `/assets/avatar/${expression}.webp`;
}

export function BotAvatar({
  sm = false,
  expression = "neutral",
}: {
  sm?: boolean;
  expression?: Expression;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={sm ? "avatar sm" : "avatar"}>
      {failed ? (
        "R"
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarSrc(expression)}
          alt="Rohan's AI twin"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

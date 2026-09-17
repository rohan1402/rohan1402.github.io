"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  ROHAN_AVATAR_EVENT,
  type RohanAvatarPose,
} from "@/lib/avatar";

const KEY = "ask-rohan-mascot-hidden";

const POSES: Record<RohanAvatarPose, { src: string; label: string }> = {
  idle: {
    src: "/assets/avatar/idle.png",
    label: "Rohan's avatar",
  },
  listening: {
    src: "/assets/avatar/listening.png",
    label: "Rohan's avatar listening",
  },
  thinking: {
    src: "/assets/avatar/thinking.png",
    label: "Rohan's avatar thinking",
  },
  explaining: {
    src: "/assets/avatar/explaining.png",
    label: "Rohan's avatar explaining",
  },
  presenting: {
    src: "/assets/avatar/presenting.png",
    label: "Rohan's avatar presenting a project",
  },
};

type AvatarCue = {
  pose?: RohanAvatarPose;
  duration?: number;
};

export function Mascot() {
  const [pose, setPose] = useState<RohanAvatarPose>("idle");
  const [hidden, setHidden] = useState(false);
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(KEY) === "1");
    } catch {
      // Ignore private-mode storage failures.
    }

    for (const { src } of Object.values(POSES)) {
      const image = new Image();
      image.src = src;
    }
  }, []);

  useEffect(() => {
    const onCue = (event: Event) => {
      const { pose: nextPose, duration } = (event as CustomEvent<AvatarCue>).detail ?? {};
      if (!nextPose || !POSES[nextPose]) return;

      if (returnTimer.current) clearTimeout(returnTimer.current);
      setPose(nextPose);

      if (duration && nextPose !== "idle") {
        returnTimer.current = setTimeout(() => setPose("idle"), duration);
      }
    };

    window.addEventListener(ROHAN_AVATAR_EVENT, onCue);
    return () => {
      window.removeEventListener(ROHAN_AVATAR_EVENT, onCue);
      if (returnTimer.current) clearTimeout(returnTimer.current);
    };
  }, []);

  function updateHidden(nextHidden: boolean) {
    setHidden(nextHidden);
    try {
      localStorage.setItem(KEY, nextHidden ? "1" : "0");
    } catch {
      // Ignore private-mode storage failures.
    }
  }

  function react() {
    if (returnTimer.current) clearTimeout(returnTimer.current);
    setPose("explaining");
    returnTimer.current = setTimeout(() => setPose("idle"), 1600);
  }

  const current = POSES[pose];

  return (
    <>
      {!hidden && (
        <motion.div
          className="mascot-host"
          data-pose={pose}
          initial={reduceMotion ? false : { opacity: 0, x: 30, y: 12 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
        >
          <button
            type="button"
            className="mascot-dismiss"
            aria-label="Hide Rohan's avatar"
            title="Hide avatar"
            onClick={() => updateHidden(true)}
          >
            ×
          </button>
          <button
            type="button"
            className="mascot-fig"
            aria-label={current.label}
            onClick={react}
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.img
                key={pose}
                className="mascot-avatar-image"
                src={current.src}
                alt=""
                draggable={false}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98, y: -4 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
              />
            </AnimatePresence>
          </button>
        </motion.div>
      )}

      {hidden && (
        <button
          type="button"
          className="mascot-restore"
          aria-label="Show Rohan's avatar"
          title="Show Rohan's avatar"
          onClick={() => updateHidden(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={POSES.idle.src} alt="" />
        </button>
      )}
    </>
  );
}

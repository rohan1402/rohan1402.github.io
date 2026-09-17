export type RohanAvatarPose =
  | "idle"
  | "listening"
  | "thinking"
  | "explaining"
  | "presenting";

export const ROHAN_AVATAR_EVENT = "rohan-avatar-cue";

export function cueAvatar(pose: RohanAvatarPose, duration?: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(ROHAN_AVATAR_EVENT, {
      detail: { pose, duration },
    })
  );
}

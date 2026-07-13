import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * The link-preview card (Open Graph image) for every shared rohanpant.com URL:
 * dark brand background, the 3D avatar with an indigo ring, name, role, and
 * the availability pill. Rendered on demand by next/og.
 */

export const runtime = "nodejs";
export const alt =
  "Ask Rohan: Rohan Pant, AI / ML Engineer. Chat with his AI twin at rohanpant.com.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const avatar = await readFile(
    join(process.cwd(), "public/assets/avatar/neutral-og.png")
  );
  const avatarSrc = `data:image/png;base64,${avatar.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#14151a",
          padding: "72px 88px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#8b8ea0",
              letterSpacing: 6,
              textTransform: "uppercase",
              marginBottom: 18,
            }}
          >
            Ask Rohan
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 78,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.05,
            }}
          >
            Rohan Pant
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 38,
              fontWeight: 600,
              color: "#7c7cf0",
              marginTop: 10,
            }}
          >
            AI / ML Engineer
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 34,
              border: "2px solid #34363f",
              borderRadius: 999,
              padding: "12px 26px",
              alignSelf: "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "#35c46a",
                marginRight: 14,
              }}
            />
            <div style={{ display: "flex", fontSize: 25, color: "#d6d7de" }}>
              Available for internships, Summer/Fall 2026
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#8b8ea0",
              marginTop: 40,
            }}
          >
            rohanpant.com, chat with my AI twin
          </div>
        </div>
        <img
          src={avatarSrc}
          width={360}
          height={360}
          style={{
            borderRadius: 999,
            border: "8px solid #7c7cf0",
          }}
          alt=""
        />
      </div>
    ),
    { ...size }
  );
}

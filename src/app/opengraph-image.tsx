import { ImageResponse } from "next/og";
import { profile } from "@/data/profile";

export const alt = `${profile.name} · ${profile.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Generated at build time, so a shared link carries the same identity as the
 * page. The palette is written out rather than read from the design tokens —
 * this renders outside the document and cannot see a CSS variable — so it has
 * to be kept in step with `globals.css` by hand.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#06070a",
        padding: "72px 80px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: 10,
            border: "1px solid #333a47",
            color: "#bcd8f2",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          DK
        </div>
        <div
          style={{
            display: "flex",
            color: "#9ba4b0",
            fontSize: 20,
            letterSpacing: 3,
          }}
        >
          {profile.name.toUpperCase()}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            display: "flex",
            color: "#eef1f5",
            fontSize: 86,
            fontWeight: 700,
            letterSpacing: -3,
            lineHeight: 1.02,
          }}
        >
          Systems that prove what they claim.
        </div>
        <div
          style={{
            display: "flex",
            color: "#9ba4b0",
            fontSize: 27,
            lineHeight: 1.4,
            maxWidth: 900,
          }}
        >
          {profile.role}. RAG with traceable citations, agent pipelines that
          recover, and machine-unlearning verification.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          borderTop: "1px solid #202530",
          paddingTop: 26,
          color: "#bcd8f2",
          fontSize: 20,
        }}
      >
        <div style={{ display: "flex" }}>2 invention disclosures</div>
        <div style={{ display: "flex", color: "#333a47" }}>/</div>
        <div style={{ display: "flex", color: "#9ba4b0" }}>
          3 engineering internships
        </div>
        <div style={{ display: "flex", color: "#333a47" }}>/</div>
        <div style={{ display: "flex", color: "#9ba4b0" }}>
          Integrated M.Tech, VIT Vellore
        </div>
      </div>
    </div>,
    size,
  );
}

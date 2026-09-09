import { ImageResponse } from "next/og";
import { profile } from "@/data/profile";

export const alt = `${profile.name} · ${profile.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Generated at build time, so a shared link carries the same identity as the page. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f2efe8",
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
              border: "1px solid #b9b1a0",
              color: "#17614a",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            DK
          </div>
          <div
            style={{
              display: "flex",
              color: "#5a5545",
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
              color: "#17160f",
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
              color: "#403c31",
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
            borderTop: "1px solid #e4dfd3",
            paddingTop: 26,
            color: "#17614a",
            fontSize: 20,
          }}
        >
          <div style={{ display: "flex" }}>2 invention disclosures</div>
          <div style={{ display: "flex", color: "#b9b1a0" }}>/</div>
          <div style={{ display: "flex", color: "#5a5545" }}>
            3 engineering internships
          </div>
          <div style={{ display: "flex", color: "#b9b1a0" }}>/</div>
          <div style={{ display: "flex", color: "#5a5545" }}>
            Integrated M.Tech, VIT Vellore
          </div>
        </div>
      </div>
    ),
    size,
  );
}

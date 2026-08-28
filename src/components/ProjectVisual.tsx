"use client";

/* ============================================================================
 * PROJECT VISUALS
 *
 * One bespoke diagram per major project, drawn from that project's real
 * measured output or its actual architecture. A screenshot would say less:
 * these show the decision that made the project worth building.
 *
 * Pure inline SVG — no library, no raster assets, sharp at any density,
 * and each one is a few hundred bytes on the wire.
 * ========================================================================= */

const SIGNAL = "#5ee9c0";
const IRIS = "#a79bff";
const AMBER = "#ffb454";
const LINE = "#262b32";
const INK_MUTE = "#767f8c";

function Frame({
  children,
  caption,
  viewBox = "0 0 480 300",
}: {
  children: React.ReactNode;
  caption: string;
  viewBox?: string;
}) {
  return (
    <figure className="w-full">
      <div className="h-px w-full bg-rule" aria-hidden="true" />
      <svg
        viewBox={viewBox}
        className="block w-full"
        role="img"
        aria-label={caption}
      >
        {children}
      </svg>
      <div className="h-px w-full bg-rule" aria-hidden="true" />
      <figcaption className="t-note pt-3">{caption}</figcaption>
    </figure>
  );
}

/* ---------------------------------------------------------------- unlearning */

/** Real numbers from the study, three seeds, mean. The oracle bar is the point. */
function UnlearningChart() {
  const rows = [
    { label: "NPO", value: 95.2, tone: AMBER },
    { label: "Gradient Ascent", value: 87.9, tone: AMBER },
    { label: "Gradient Difference", value: 79.5, tone: AMBER },
    { label: "Retrained oracle", value: 28.1, tone: SIGNAL },
  ];

  const X = 168;
  const W = 272;

  return (
    <Frame
      viewBox="0 0 480 260"
      caption="Knowledge recovered by a relearning attack · 3 seeds, mean"
    >
      <text x="24" y="30" fill={INK_MUTE} fontSize="9" letterSpacing="1.4">
        RECOVERED AFTER &quot;FORGETTING&quot;
      </text>

      {rows.map((r, i) => {
        const y = 62 + i * 44;
        return (
          <g key={r.label}>
            <text
              x={X - 12}
              y={y + 11}
              fill={r.tone === SIGNAL ? SIGNAL : "#a5acb6"}
              fontSize="11"
              textAnchor="end"
            >
              {r.label}
            </text>
            <rect x={X} y={y} width={W} height="15" fill="#12151a" rx="2" />
            <rect
              x={X}
              y={y}
              width={(r.value / 100) * W}
              height="15"
              fill={r.tone}
              fillOpacity={r.tone === SIGNAL ? 0.9 : 0.34}
              rx="2"
            />
            <rect
              x={X + (r.value / 100) * W - 1.5}
              y={y}
              width="1.5"
              height="15"
              fill={r.tone}
            />
            <text
              x={X + (r.value / 100) * W + 8}
              y={y + 11}
              fill={r.tone}
              fontSize="10"
              fontFamily="monospace"
            >
              {r.value}%
            </text>
          </g>
        );
      })}

      <line
        x1={X}
        y1="52"
        x2={X}
        y2="238"
        stroke={LINE}
        strokeDasharray="2 3"
      />
      <text x="24" y="243" fill={INK_MUTE} fontSize="9">
        A loss curve reports none of this.
      </text>
    </Frame>
  );
}

/* ---------------------------------------------------------------------- RAG */

function RagPipeline() {
  const box = (
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    accent = false,
  ) => (
    <g key={`${label}-${x}-${y}`}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="4"
        fill={accent ? "#0d1f1b" : "#12151a"}
        stroke={accent ? SIGNAL : LINE}
        strokeOpacity={accent ? 0.5 : 1}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 + 3.5}
        fill={accent ? SIGNAL : "#a5acb6"}
        fontSize="9.5"
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  );

  const arrow = (x1: number, y1: number, x2: number, y2: number) => (
    <path
      key={`${x1}-${y1}-${x2}-${y2}`}
      d={`M${x1} ${y1} L${x2} ${y2}`}
      stroke={LINE}
      strokeWidth="1"
      markerEnd="url(#head)"
    />
  );

  return (
    <Frame
      viewBox="0 0 480 260"
      caption="Hybrid retrieval → rerank → compress → cited answer"
    >
      <defs>
        <marker
          id="head"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0 0 L6 3 L0 6 z" fill={LINE} />
        </marker>
      </defs>

      {box(20, 108, 62, 30, "Question")}

      {arrow(84, 123, 106, 108)}
      {arrow(84, 123, 106, 140)}

      {box(108, 82, 78, 28, "Dense · vectors")}
      {box(108, 126, 78, 28, "BM25 · exact")}

      <text x="147" y="72" fill={INK_MUTE} fontSize="8" textAnchor="middle">
        TICKERS AND FIGURES RANK
      </text>
      <text x="147" y="171" fill={INK_MUTE} fontSize="8" textAnchor="middle">
        POORLY UNDER VECTORS ALONE
      </text>

      {arrow(188, 96, 210, 114)}
      {arrow(188, 140, 210, 122)}

      {box(212, 104, 74, 28, "Cross-encoder")}
      {arrow(288, 118, 306, 118)}
      {box(308, 104, 68, 28, "Compress", true)}
      {arrow(378, 118, 396, 118)}
      {box(398, 96, 62, 44, "Answer + cites", true)}

      <text x="342" y="150" fill={AMBER} fontSize="9" textAnchor="middle">
        −40% tokens
      </text>

      <g>
        <text x="20" y="218" fill={INK_MUTE} fontSize="9" letterSpacing="1.2">
          FAITHFULNESS · 50-QUESTION RAGAS SET
        </text>
        <rect x="20" y="228" width="180" height="8" rx="2" fill="#12151a" />
        <rect
          x="20"
          y="228"
          width={180 * 0.71}
          height="8"
          rx="2"
          fill={AMBER}
          fillOpacity="0.35"
        />
        <text x="210" y="235" fill={INK_MUTE} fontSize="9" fontFamily="monospace">
          0.71
        </text>
        <text x="248" y="235" fill={INK_MUTE} fontSize="9">
          →
        </text>
        <rect x="268" y="228" width="180" height="8" rx="2" fill="#12151a" />
        <rect
          x="268"
          y="228"
          width={180 * 0.89}
          height="8"
          rx="2"
          fill={SIGNAL}
          fillOpacity="0.85"
        />
        <text x="454" y="235" fill={SIGNAL} fontSize="9" fontFamily="monospace" textAnchor="end">
          0.89
        </text>
      </g>
    </Frame>
  );
}

/* ----------------------------------------------------------------- the gate */

function VerificationGate() {
  return (
    <Frame
      viewBox="0 0 480 260"
      caption="Verification is a precondition, not a report you read afterwards"
    >
      <defs>
        <marker id="h2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 z" fill={LINE} />
        </marker>
      </defs>

      <rect x="20" y="106" width="86" height="34" rx="4" fill="#12151a" stroke={LINE} />
      <text x="63" y="127" fill="#a5acb6" fontSize="9.5" textAnchor="middle">
        Erasure request
      </text>

      <path d="M108 123 L128 123" stroke={LINE} markerEnd="url(#h2)" />

      <rect x="130" y="96" width="86" height="54" rx="4" fill="#12151a" stroke={LINE} />
      <text x="173" y="116" fill="#a5acb6" fontSize="9.5" textAnchor="middle">
        Provenance
      </text>
      <text x="173" y="130" fill={INK_MUTE} fontSize="8" textAnchor="middle">
        lookup, not search
      </text>
      <text x="173" y="143" fill={INK_MUTE} fontSize="8" textAnchor="middle">
        exact target set
      </text>

      <path d="M218 123 L238 123" stroke={LINE} markerEnd="url(#h2)" />

      <rect x="240" y="88" width="86" height="70" rx="4" fill="#12151a" stroke={LINE} />
      <text x="283" y="107" fill="#a5acb6" fontSize="9.5" textAnchor="middle">
        Unlearn
      </text>
      <text x="283" y="122" fill={INK_MUTE} fontSize="8" textAnchor="middle">
        behavioural audit
      </text>
      <text x="283" y="135" fill={INK_MUTE} fontSize="8" textAnchor="middle">
        relearning attack
      </text>
      <text x="283" y="148" fill={INK_MUTE} fontSize="8" textAnchor="middle">
        membership inference
      </text>

      <path d="M328 123 L348 123" stroke={LINE} markerEnd="url(#h2)" />

      {/* The gate */}
      <g>
        <rect
          x="350"
          y="80"
          width="14"
          height="86"
          rx="2"
          fill={SIGNAL}
          fillOpacity="0.12"
          stroke={SIGNAL}
          strokeOpacity="0.5"
        />
        <text
          x="357"
          y="72"
          fill={SIGNAL}
          fontSize="8"
          letterSpacing="1.4"
          textAnchor="middle"
        >
          GATE
        </text>
      </g>

      <path d="M366 104 L390 92" stroke={SIGNAL} strokeOpacity="0.55" markerEnd="url(#h2)" />
      <path d="M366 142 L390 154" stroke={AMBER} strokeOpacity="0.45" strokeDasharray="3 3" />

      <rect x="392" y="76" width="68" height="30" rx="4" fill="#0d1f1b" stroke={SIGNAL} strokeOpacity="0.5" />
      <text x="426" y="95" fill={SIGNAL} fontSize="9.5" textAnchor="middle">
        Deploy
      </text>

      <rect x="392" y="140" width="68" height="30" rx="4" fill="#1f1608" stroke={AMBER} strokeOpacity="0.4" />
      <text x="426" y="159" fill={AMBER} fontSize="9.5" textAnchor="middle">
        Withheld
      </text>

      <text x="20" y="212" fill={INK_MUTE} fontSize="9" letterSpacing="1.2">
        FLEET MONITORING NEVER PAUSES · ~1/10 OF RETRAINING TIME
      </text>
      <line x1="20" y1="224" x2="460" y2="224" stroke={LINE} strokeDasharray="2 3" />
      <text x="20" y="242" fill={AMBER} fontSize="9">
        Feasibility check refuses the request outright when the target set is indistinguishable.
      </text>
    </Frame>
  );
}

/* ------------------------------------------------------------- agent graph */

function AgentGraph() {
  const agents = [
    { x: 150, y: 62, label: "Data gatherer" },
    { x: 268, y: 62, label: "Fundamental" },
    { x: 326, y: 128, label: "Sentiment" },
    { x: 268, y: 194, label: "Risk" },
    { x: 150, y: 194, label: "Report writer" },
  ];

  return (
    <Frame
      viewBox="0 0 480 260"
      caption="Five agents over one typed state graph, with checkpointed resume"
    >
      <circle cx="228" cy="128" r="40" fill="#0d1f1b" stroke={SIGNAL} strokeOpacity="0.4" />
      <text x="228" y="124" fill={SIGNAL} fontSize="9.5" textAnchor="middle">
        Pydantic
      </text>
      <text x="228" y="137" fill={SIGNAL} fontSize="9.5" textAnchor="middle">
        state
      </text>

      {agents.map((a) => (
        <g key={a.label}>
          <line
            x1="228"
            y1="128"
            x2={a.x}
            y2={a.y}
            stroke={LINE}
            strokeDasharray="2 3"
          />
          <rect
            x={a.x - 44}
            y={a.y - 13}
            width="88"
            height="26"
            rx="13"
            fill="#12151a"
            stroke={LINE}
          />
          <text x={a.x} y={a.y + 3.5} fill="#a5acb6" fontSize="9" textAnchor="middle">
            {a.label}
          </text>
        </g>
      ))}

      <g>
        <rect x="20" y="106" width="14" height="44" rx="2" fill="#12151a" stroke={AMBER} strokeOpacity="0.4" />
        <text x="27" y="98" fill={AMBER} fontSize="7.5" letterSpacing="1.2" textAnchor="middle">
          CKPT
        </text>
        <path d="M36 128 L60 128" stroke={AMBER} strokeOpacity="0.4" strokeDasharray="3 3" />
      </g>

      <text x="20" y="238" fill={INK_MUTE} fontSize="9">
        A run that fails halfway resumes from the last good state.
      </text>
    </Frame>
  );
}

/* ------------------------------------------------------- walk-forward split */

function WalkForward() {
  const folds = [0, 1, 2, 3];
  const W = 400;
  const X = 56;

  return (
    <Frame
      viewBox="0 0 480 260"
      caption="Expanding-window validation · random k-fold leaks the future"
    >
      <text x="20" y="28" fill={INK_MUTE} fontSize="9" letterSpacing="1.4">
        TIME →
      </text>

      {folds.map((f) => {
        const y = 48 + f * 40;
        const trainW = W * (0.28 + f * 0.16);
        return (
          <g key={f}>
            <text x={X - 10} y={y + 11} fill={INK_MUTE} fontSize="9" textAnchor="end" fontFamily="monospace">
              {f + 1}
            </text>
            <rect x={X} y={y} width={W} height="15" rx="2" fill="#12151a" />
            <rect x={X} y={y} width={trainW} height="15" rx="2" fill={SIGNAL} fillOpacity="0.5" />
            <rect x={X + trainW + 3} y={y} width={W * 0.14} height="15" rx="2" fill={AMBER} fillOpacity="0.55" />
          </g>
        );
      })}

      <g transform="translate(56, 218)">
        <rect width="11" height="11" rx="2" fill={SIGNAL} fillOpacity="0.5" />
        <text x="18" y="9" fill="#a5acb6" fontSize="9.5">
          Train
        </text>
        <rect x="70" width="11" height="11" rx="2" fill={AMBER} fillOpacity="0.55" />
        <text x="88" y="9" fill="#a5acb6" fontSize="9.5">
          Validate, always after
        </text>
      </g>

      <text x="20" y="245" fill={INK_MUTE} fontSize="9">
        Nothing after the validation window ever enters training.
      </text>
    </Frame>
  );
}

/* ---------------------------------------------------------------- geospatial */

function GeoStack() {
  const layers = [
    { label: "Candidate sites", tone: SIGNAL },
    { label: "AHP suitability", tone: LINE },
    { label: "CA-ANN growth 2030/35", tone: AMBER },
    { label: "Road network · 59,081 edges", tone: LINE },
    { label: "Built-up · Landsat 8/9", tone: LINE },
  ];

  return (
    <Frame
      viewBox="0 0 480 280"
      caption="Five raster layers, two validation gates, one ranking"
    >
      {layers.map((l, i) => {
        const y = 34 + i * 42;
        return (
          <g key={l.label}>
            <path
              d={`M110 ${y} L330 ${y - 22} L430 ${y + 6} L210 ${y + 28} Z`}
              fill={l.tone === LINE ? "#12151a" : l.tone}
              fillOpacity={l.tone === LINE ? 1 : 0.18}
              stroke={l.tone}
              strokeOpacity={l.tone === LINE ? 1 : 0.55}
            />
            <text x="98" y={y + 8} fill={l.tone === LINE ? INK_MUTE : l.tone} fontSize="9" textAnchor="end">
              {l.label}
            </text>
          </g>
        );
      })}

      <text x="20" y="266" fill={INK_MUTE} fontSize="9">
        Hindcast against a withheld epoch · run with and without the growth criterion.
      </text>
    </Frame>
  );
}

/* ------------------------------------------------------------------ router */

const VISUALS: Record<string, () => React.JSX.Element> = {
  "beyond-the-loss-curve": UnlearningChart,
  "financial-rag": RagPipeline,
  aeroforge: VerificationGate,
  "investment-research": AgentGraph,
  "portfolio-ml": WalkForward,
  "hospital-siting": GeoStack,
};

export function ProjectVisual({ id }: { id: string }) {
  const Visual = VISUALS[id];
  if (!Visual) return null;
  return <Visual />;
}

export function hasVisual(id: string) {
  return id in VISUALS;
}

export type Metric = { value: string; label: string };

export type ProjectLink = {
  kind: "github" | "demo" | "paper" | "index";
  href: string;
  label: string;
};

export type Project = {
  id: string;
  /** 1 = flagship case study, 2 = featured, 3 = supporting build. */
  tier: 1 | 2 | 3;
  title: string;
  /** One-line purpose. */
  tagline: string;
  category: string;
  year: string;
  /** Short, quotable framing of the problem. */
  problem: string;
  /** What was built in response. */
  solution: string;
  /** Explicit ownership statement. */
  contribution: string;
  /** Technical decisions worth an interviewer's attention. */
  technical: string[];
  /** Only measured results. Empty where nothing was measured. */
  metrics: Metric[];
  stack: string[];
  links: ProjectLink[];
  /** Set where the repository is not public. */
  note?: string;
  /** Named parts of an orchestrated system, listed in execution order. */
  roster?: string[];
  /** Linked patent or paper id. */
  associated?: string;
};

export const projects: Project[] = [
  /* ─────────────────────────── FLAGSHIP ─────────────────────────── */
  {
    id: "beyond-the-loss-curve",
    tier: 1,
    title: "Beyond the Loss Curve",
    tagline:
      "Proving a language model actually forgot something, instead of trusting a loss curve that says it did.",
    category: "Applied research · Trustworthy ML",
    year: "2025 to 2026",
    problem:
      "Machine unlearning is judged almost entirely by a rising loss on the deleted records. But a loss curve only reports how surprised a model is by one exact string. It says nothing about whether the fact can still be recovered by asking differently, or whether it is genuinely gone rather than merely suppressed.",
    solution:
      "A verification framework that interrogates every deleted record through five differently-phrased probes, detects leakage by searching the answers for the record's true values, and folds the evidence into a single trustworthiness score. It then attacks its own verdict with membership inference and a relearning attempt, graded against a reference model retrained without the deleted data.",
    contribution:
      "First author and sole engineer. Built the 51M-parameter GPT-style transformer from scratch so every fact the model knows traces back to a training row. That is what makes 'did it forget?' a measurable question rather than a guess. Implemented all three unlearning objectives, the oracle retrain, the audit stage and both attacks.",
    technical: [
      "Training from scratch, rather than fine-tuning a public checkpoint, gives perfect ground truth: there is no pre-training corpus to hide a leaked fact in.",
      "Three unlearning objectives compared under one harness: gradient ascent as the baseline, gradient difference with a retain anchor, and NPO's bounded self-limiting objective.",
      "A five-probe behavioural audit plus a value-based leak detector, combined as Trust T = 2·F·U / (F + U). It is a harmonic mean, so a method cannot buy forgetting by destroying utility.",
      "Adversarial stage: membership-inference AUC and a brief relearning attack, both scored against a from-scratch oracle so the numbers have a reference point.",
      "Benchmark built deterministically from WHO Global Health Observatory immunisation and tuberculosis indicators. That is real published data, reproducible from the source release and a stated seed rather than shipped as a static file.",
    ],
    metrics: [
      { value: "0.501", label: "Best trustworthiness score (NPO)" },
      { value: "95.2%", label: "Knowledge recovered by relearning attack" },
      { value: "28.1%", label: "Same attack on a retrained oracle" },
      { value: "3", label: "Unlearning objectives compared" },
    ],
    stack: [
      "PyTorch",
      "Transformers from scratch",
      "NPO",
      "Membership Inference",
      "RAGAS-style eval",
      "Python",
    ],
    links: [
      {
        kind: "github",
        href: "https://github.com/dhanushkonduru/beyond-the-loss-curve",
        label: "Source, figures & results",
      },
    ],
    associated: "patent-unlearning",
  },
  {
    id: "financial-rag",
    tier: 1,
    title: "Financial Document Intelligence RAG",
    tagline:
      "Ask a 10-K a question in plain English and get an answer you can trace to the exact paragraph that produced it.",
    category: "LLM systems · Retrieval",
    year: "2025",
    problem:
      "Analysts lose hours inside filings, and a RAG system that answers fluently but cannot cite its source is worse than no system at all in a regulated setting. Pure vector search also quietly fails on the things finance cares about most: tickers, dollar amounts, exact figures.",
    solution:
      "A retrieval pipeline over SEC 10-K filings and earnings transcripts that pairs BM25 with dense retrieval, reranks with a cross-encoder, and returns every answer with the source chunk IDs attached, so any claim in the output can be walked back to the section of the filing that produced it.",
    contribution:
      "Designed and built the whole pipeline: ingestion, chunking, the hybrid retriever, the reranker stage, contextual compression, the FastAPI service, and the RAGAS evaluation set used to decide whether each change was actually an improvement.",
    technical: [
      "Hybrid retrieval: dense embeddings for meaning, BM25 for exact strings. Ticker symbols and figures rank poorly under pure vector search, so combining both before reranking is the difference between plausible and auditable.",
      "A cross-encoder reranker reorders the top candidates, so recall can be set generously at the retrieval stage without polluting the generation context.",
      "Contextual compression filters retrieved chunks before generation. That single change cut token cost by roughly 40% without losing citation accuracy.",
      "Faithfulness measured on a 50-question RAGAS eval set that also tracks answer relevance and context precision, so a gain in one dimension can't hide a regression in another.",
      "Built on LangChain LCEL, which keeps each stage independently swappable and testable rather than tangled in one prompt.",
    ],
    metrics: [
      { value: "0.71 → 0.89", label: "Faithfulness on a 50-question RAGAS set" },
      { value: "~40%", label: "Token cost reduction" },
      { value: "2", label: "Document types (filings, transcripts)" },
    ],
    stack: [
      "Python",
      "LangChain LCEL",
      "FastAPI",
      "ChromaDB",
      "FAISS",
      "BM25",
      "Cross-encoder Rerank",
      "RAGAS",
      "AWS",
    ],
    links: [
      {
        kind: "github",
        href: "https://github.com/dhanushkonduru/financial-rag",
        label: "Repository",
      },
    ],
  },

  /* ─────────────────────────── FEATURED ─────────────────────────── */
  {
    id: "aeroforge",
    tier: 2,
    title: "AeroForge: Verification-Gated Digital Twins",
    tagline:
      "A fleet digital twin that can be told to forget a departing operator, and refuses to deploy until it can prove the knowledge is gone.",
    category: "Applied research · Industrial ML",
    year: "2026",
    problem:
      "Deleting an operator's rows from a database does not delete what a model learned from them. For a fleet under a continuous monitoring contract, the usual answer is to retrain from scratch, which takes the model out of service for as long as the retrain runs.",
    solution:
      "Ownership is stamped onto every telemetry reading as it arrives, so an erasure request resolves to an exact target set by indexed lookup rather than similarity search. The influence is removed without retraining, the result is attacked to check the knowledge was erased rather than hidden, and a deployment gate holds the model out of service until it passes.",
    contribution:
      "First-named inventor on the disclosure and sole engineer on both implementations: turbofan fleet prognostics (twin-forget), then a port to a second domain, 12-lead diagnostic ECG across four hospital sites (heart-forget).",
    technical: [
      "Provenance indexing means an erasure request is resolved by lookup rather than similarity search. That distinction decides whether the target set is exact or approximate.",
      "A feasibility check refuses the request outright when the departing operator's engines turn out to be statistically indistinguishable from the rest of the fleet on the same contract, because in that case no honest erasure claim can be made.",
      "The deployment gate is the architectural point: verification is not a report you read afterwards, it is a precondition the model has to clear.",
      "The ECG port uses four genuinely different source databases from the PhysioNet/CinC Challenge 2021, covering different hospitals, equipment and patient populations. They are balanced at 1,500 records each so 'this site was forgotten' can't be confused with 'this site was small'.",
    ],
    metrics: [
      { value: "~1/10", label: "Of retraining time to strip an operator" },
      { value: "0", label: "Service pauses for fleet monitoring" },
      { value: "6,000", label: "12-lead ECGs in the second-domain port" },
      { value: "4", label: "Independent source sites" },
    ],
    stack: [
      "PyTorch",
      "Digital Twins",
      "Provenance Indexing",
      "Membership Inference",
      "PhysioNet",
      "Python",
    ],
    links: [],
    note: "Private repository ahead of filing. Walkthrough available on request.",
    associated: "patent-aeroforge",
  },
  {
    id: "investment-research",
    tier: 1,
    title: "Multi-Agent Investment Research Assistant",
    tagline:
      "Five specialist agents assemble and critique an investment thesis, and a half-failed run resumes instead of starting over.",
    category: "Agentic systems",
    year: "2025",
    problem:
      "A single 'write me a report' prompt produces confident prose with no separation between gathering evidence and judging it. And long agent runs fail on a tool call or a context overflow, usually with nothing to show for the tokens already spent.",
    solution:
      "A LangGraph system where a data gatherer, fundamental analyst, sentiment analyst, risk analyst and report writer share one typed Pydantic state graph, with checkpointing so a run that fails halfway resumes from the last good state rather than restarting.",
    contribution:
      "Built the graph, the shared state schema, the tool layer and the observability. Wired the RAG service in as a tool alongside the SEC EDGAR and yfinance APIs, and used LangSmith traces to track down hallucinated tool calls and context-overflow failures during agent runs.",
    technical: [
      "A typed Pydantic state graph is the load-bearing decision: deterministic code orchestrates the run, and the model only exercises judgement inside a node.",
      "Checkpointing turns a long agent run from all-or-nothing into resumable, which is the difference between a demo and something you'd leave running.",
      "The retrieval service is exposed as one tool among several, so the agents reason over grounded filings rather than over their own priors.",
      "LangSmith tracing was what actually surfaced the two real failure modes: hallucinated tool calls, and context overflow inside a node.",
    ],
    metrics: [
      { value: "5", label: "Specialist agents" },
      { value: "Typed", label: "Pydantic state graph" },
    ],
    roster: [
      "Data gatherer",
      "Fundamental analyst",
      "Sentiment analyst",
      "Risk analyst",
      "Report writer",
    ],
    stack: [
      "Python",
      "LangGraph",
      "LangSmith",
      "OpenAI API",
      "SEC EDGAR API",
      "Redis",
      "Pydantic",
    ],
    links: [
      {
        kind: "github",
        href: "https://github.com/dhanushkonduru/investment-research",
        label: "Repository",
      },
    ],
  },
  {
    id: "hospital-siting",
    tier: 2,
    title: "Hospital Site Suitability, Vellore",
    tagline:
      "Where should Vellore put its next hospital? A geospatial pipeline that treats forecast urban growth as a siting criterion, then measures whether the forecast helped.",
    category: "Geospatial ML · Research",
    year: "2025 to 2026",
    problem:
      "Vellore's built-up area expanded steadily from 2013 to 2024 along the north-western and south-western road corridors, while hospitals stayed clustered in the city centre. Siting studies usually treat future growth as background context and never test whether including it changed the answer.",
    solution:
      "A fully automated, reproducible pipeline: a Random Forest built-up classifier over Landsat 8/9 composites, a CA-ANN urban growth model projected to 2030 and 2035, and an AHP multi-criteria suitability analysis that ranks candidate sites. The whole thing runs twice, once with the growth criterion and once without.",
    contribution:
      "Built the pipeline end to end across ten staged scripts, including the two validation stages that make the claim testable: a hindcast against an observed epoch withheld from calibration, and a baseline comparison that isolates the forecast's contribution.",
    technical: [
      "The growth model is validated by hindcasting an epoch deliberately withheld from its calibration. Without that, a growth forecast is unfalsifiable.",
      "The siting analysis runs with and without the growth criterion, so the forecast's contribution is measured rather than asserted.",
      "Built-up classification is checked against four independent reference products (GHS-BUILT-S, Esri Land Cover, WorldCover and JRC Global Surface Water) rather than self-reported accuracy.",
      "Pooled Random Forest, 500 trees, 21 features, calibrated decision threshold; water taken from JRC Global Surface Water rather than inferred.",
    ],
    metrics: [
      { value: "2013→2024", label: "Landsat 8/9 epochs classified" },
      { value: "123", label: "Healthcare facilities mapped" },
      { value: "59,081", label: "OSM road edges in the network" },
      { value: "2030/2035", label: "Growth horizons projected" },
    ],
    stack: [
      "Python",
      "Random Forest",
      "CA-ANN",
      "AHP",
      "Landsat 8/9",
      "GeoPandas",
      "Rasterio",
      "OSM",
    ],
    links: [],
    note: "Private repository. Manuscript under revision.",
    associated: "paper-urban",
  },
  {
    id: "portfolio-ml",
    tier: 2,
    title: "Portfolio Construction + MLOps Pipeline",
    tagline:
      "Cross-sectional return prediction on S&P 500 names, validated the way ordered financial time series actually demand.",
    category: "Classical ML · MLOps",
    year: "2025",
    problem:
      "Random k-fold cross-validation quietly leaks future information into training whenever the underlying data is an ordered time series, which makes a great many backtests look better than they are. And a model that isn't monitored after deployment silently decays as input distributions move.",
    solution:
      "An XGBoost cross-sectional return predictor over S&P 500 names using Fama-French style features, validated with expanding-window walk-forward splits, wrapped in an MLOps path: experiment tracking, data versioning, daily drift comparison against the training baseline, and a FastAPI endpoint serving whichever model is registered as production.",
    contribution:
      "Built the feature pipeline, the walk-forward validation harness, the MLflow/DVC tracking layer, the Evidently drift job and the inference service.",
    technical: [
      "Expanding-window walk-forward splits, because random k-fold leaks future information whenever the data is an ordered financial time series.",
      "Evidently compares live input distributions against the training baseline daily and alerts on feature drift, so decay is observed rather than discovered.",
      "A model registry stage called 'Production' is what makes the serving endpoint deterministic about which artefact it is running.",
      "DVC versions the data alongside the code, so a tracked experiment is reproducible rather than merely logged.",
    ],
    metrics: [
      { value: "S&P 500", label: "Cross-sectional universe" },
      { value: "Daily", label: "Drift monitoring cadence" },
    ],
    stack: [
      "Python",
      "XGBoost",
      "scikit-learn",
      "MLflow",
      "DVC",
      "Evidently AI",
      "FastAPI",
    ],
    links: [
      {
        kind: "github",
        href: "https://github.com/dhanushkonduru/portfolio-ml",
        label: "Repository",
      },
    ],
  },

  /* ────────────────────────── SUPPORTING ────────────────────────── */
  {
    id: "req2test",
    tier: 3,
    title: "req2test",
    tagline:
      "An agent that reads a requirement and produces a traceable test plan, then audits its own output with code rather than more prose.",
    category: "Agentic systems · Developer tooling",
    year: "2026",
    problem:
      "One prompt per bullet in the spec produces a chatbot with extra steps: no record of what was assumed, no traceability, and no way to tell a good test plan from a plausible one.",
    solution:
      "A pipeline of typed stages where deterministic code orchestrates and the model only exercises judgement inside a node. It asks about what is genuinely unclear, records what it assumed, derives cases from formal design techniques, and audits the result programmatically.",
    contribution:
      "Sole author. Designed the stage contracts, the correction loop and the audit stage.",
    technical: [
      "Every stage declares a Pydantic model it must return; a schema violation feeds the validation error itself back as a correction turn.",
      "A stage returns a valid object or raises. Nothing downstream ever receives a half-parsed dict.",
      "Test cases derive from formal design techniques, so coverage is argued from a method rather than from the model's confidence.",
    ],
    metrics: [],
    stack: ["Python", "Pydantic", "LLM Orchestration", "CLI"],
    links: [],
    note: "Private repository. Walkthrough available on request.",
  },
  {
    id: "ai-voice-commerce",
    tier: 3,
    title: "AI E-Commerce Voice Sales Agent",
    tagline:
      "A storefront where a customer requests a call and an AI product expert phones them about that exact product, using verified catalog data only.",
    category: "Full-stack · Voice AI",
    year: "2025",
    problem:
      "A voice agent that improvises product details is a liability. The hard part is not the call. It is binding the conversation to one verified product record and keeping it there.",
    solution:
      "Search → product page → call request → the backend binds the exact product and builds a verified context → an outbound call is placed → the transcript is processed into a personalised follow-up. Failure handling and retry included.",
    contribution:
      "Built the full workflow: product binding, verified context construction, the live tool-call layer during the call, transcript analysis, follow-up messaging and the failure/retry path.",
    technical: [
      "The agent's context is assembled from catalog records rather than free text, which is what stops it inventing specifications mid-call.",
      "Live tool calls during the conversation let the agent answer from the catalog instead of from memory.",
      "The entire pipeline runs end to end against a mock voice provider, so the workflow is verifiable without a live telephony number.",
    ],
    metrics: [],
    stack: ["Python", "FastAPI", "Retell AI", "Next.js", "Docker", "WhatsApp API"],
    links: [],
    note: "Runs end to end on a mock voice provider; live calls need broker credentials.",
  },
  {
    id: "speech-benchmark",
    tier: 3,
    title: "Speech Transcription Benchmark",
    tagline:
      "A CLI that returns a transcript plus the latency, cost and quality numbers behind it, as structured JSON.",
    category: "Tooling · Evaluation",
    year: "2025",
    problem:
      "Speech-to-text quality is usually judged by reading the output. That says nothing about cost per minute, stage-level latency, or how the model behaves on long or code-switched audio.",
    solution:
      "A production-shaped Python CLI with automatic chunking and overlap deduplication for long audio, retry with exponential backoff, stage-level timings, quality heuristics, and multilingual transcription with code-switching detection.",
    contribution: "Sole author.",
    technical: [
      "Overlap deduplication across chunk boundaries, so long audio doesn't produce repeated phrases at every seam.",
      "Stage-level timings (metadata, upload, API, merge, total) make it possible to say where the time actually went.",
      "Structured JSONL logs and a backward-compatible JSON schema, so extended fields don't break existing consumers.",
    ],
    metrics: [],
    stack: ["Python", "OpenAI Speech API", "CLI", "JSONL"],
    links: [
      {
        kind: "github",
        href: "https://github.com/dhanushkonduru/speech-benchmark",
        label: "Repository",
      },
    ],
  },
  {
    id: "mt5-platform",
    tier: 3,
    title: "MT5 Web Trading Platform",
    tagline:
      "Manage a MetaTrader 5 account from the browser, with the honest architecture write-up that the platform's auth model forces.",
    category: "Full-stack · Systems",
    year: "2025",
    problem:
      "MetaTrader 5 has no API keys, no OAuth and no client secret for application developers. Login, password and server is the entire authentication model on offer, which constrains what a safe web platform can even look like.",
    solution:
      "A read-only dashboard plus an EA-bridge architecture that works on macOS with no password and no Windows host, with live trading held behind two independent flags and a demo-only gate.",
    contribution:
      "Built the backend, the bridge and the dashboard, and documented the authentication constraint rather than papering over it.",
    technical: [
      "The EA-bridge design sidesteps credential handling entirely. That is the decisive architectural choice.",
      "Write operations on the real provider are deliberately gated; live trading needs two independent flags plus a demo-only check.",
      "The status table in the README states plainly which phases are verified against a real broker and which are only verified against the mock.",
    ],
    metrics: [],
    stack: ["Python", "FastAPI", "MQL5", "React", "WebSockets"],
    links: [],
    note: "Private repository. Architecture notes available on request.",
  },
  {
    id: "trek-manager",
    tier: 3,
    title: "Trekking Management Application",
    tagline:
      "Replaces the spreadsheets, WhatsApp groups and phone calls an adventure operator runs on.",
    category: "Full-stack",
    year: "2026",
    problem:
      "Small adventure operators coordinate treks across spreadsheets and group chats, so approvals, staff assignment and slot availability have no single source of truth.",
    solution:
      "A role-based web application with separate dashboards for Admin, Trek Staff and Trekkers, enforcing trek approvals, staff assignment, slot availability and complete booking history.",
    contribution: "Sole author, built against a mandated framework list.",
    technical: [
      "Three distinct permission surfaces: the owner sees everything, a guide sees only assigned treks, a trekker sees only their own bookings.",
      "Slot availability and booking history are enforced server-side rather than trusted from the client.",
    ],
    metrics: [],
    stack: ["Python", "Flask", "SQLAlchemy", "Vue", "SQLite"],
    links: [
      {
        kind: "github",
        href: "https://github.com/dhanushkonduru/trek_manager",
        label: "Repository",
      },
    ],
  },
];

export const flagshipProjects = projects.filter((p) => p.tier === 1);
export const featuredProjects = projects.filter((p) => p.tier === 2);
export const supportingProjects = projects.filter((p) => p.tier === 3);

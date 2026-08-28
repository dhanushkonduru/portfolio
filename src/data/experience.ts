export type Role = {
  id: string;
  kind: "work" | "education" | "research";
  company: string;
  title: string;
  location: string;
  mode: string;
  start: string;
  end: string;
  period: string;
  /** Rewritten from résumé bullets. Same claims, tighter language. */
  points: string[];
  stack: string[];
};

/** Reverse-chronological. Straight from the résumé's experience section. */
export const experience: Role[] = [
  {
    id: "ceec",
    kind: "work",
    company: "CEEC Global Ventures",
    title: "Software Engineer Intern",
    location: "Remote",
    mode: "Remote",
    start: "2025-10",
    end: "2026-05",
    period: "Oct 2025 to May 2026",
    points: [
      "Built the multi-tenant backend for Tabzy, a cloud ERP/POS product, using custom Django middleware and RBAC so no company can ever read another company's records. Billing, inventory and orders all run in production, with zero cross-tenant leakage across concurrent tenants.",
      "Shipped an API-key system so businesses could connect Tabzy to the tools they already use, owning the feature end to end from schema design through the production release.",
      "Sole backend engineer on BlogSpeed, an AI content automation platform: wrote the auto-scheduler for hands-free publishing, the API-key integrations and the content formatting layer, then containerised the service and deployed it to GCP via Cloud Build and Cloud Run.",
    ],
    stack: [
      "Django",
      "PostgreSQL",
      "Multi-Tenant Architecture",
      "RBAC",
      "Docker",
      "GCP Cloud Run",
      "Cloud Build",
    ],
  },
  {
    id: "centific",
    kind: "work",
    company: "Centific Global Technologies",
    title: "AI/ML Intern",
    location: "Hyderabad, IN",
    mode: "Hybrid",
    start: "2025-06",
    end: "2025-07",
    period: "Jun 2025 to Jul 2025",
    points: [
      "Benchmarked five models (GPT, DeepSeek, Phi-2, Phi-3 and Gemma) across several NLP tasks through an automated evaluation harness, comparing latency, throughput and output consistency so model selection came down to measured numbers rather than guesswork.",
      "Fine-tuned Phi-3 and DeepSeek with LoRA, running hyperparameter sweeps on domain-specific datasets and writing the results up in notebooks anyone on the team could rerun without asking first.",
      "Read through recent work on fine-tuning methods and newer architectures, then turned it into short internal reports the team used when deciding what was worth adopting.",
    ],
    stack: [
      "Python",
      "PyTorch",
      "HuggingFace Transformers",
      "scikit-learn",
      "LoRA",
      "OpenAI API",
      "LLM Evaluation",
    ],
  },
  {
    id: "aapoon",
    kind: "work",
    company: "Aapoon",
    title: "Python Intern",
    location: "Hyderabad, IN",
    mode: "Offline",
    start: "2024-05",
    end: "2024-06",
    period: "May 2024 to Jun 2024",
    points: [
      "Developed a Django and DRF task-management app with OTP login and role-based access for three user types, backed by a normalised schema with validation on every write path, plus REST endpoints that fed reports on how the product was actually being used day to day.",
      "Followed that with a college management portal in Django covering student records, attendance marking and separate permission levels for staff, students and administrative users.",
    ],
    stack: ["Python", "Django", "Django REST Framework", "PostgreSQL"],
  },
  {
    id: "vit",
    kind: "education",
    company: "Vellore Institute of Technology",
    title: "Integrated M.Tech in Software Engineering",
    location: "Vellore, TN",
    mode: "On campus",
    start: "2022-08",
    end: "2027-05",
    period: "Expected 2027",
    points: [
      "Five-year integrated master's in Software Engineering. Coursework in machine learning, distributed systems, databases and software architecture, run alongside the applied research that produced both invention disclosures.",
    ],
    stack: ["Software Engineering", "Machine Learning", "Systems"],
  },
];

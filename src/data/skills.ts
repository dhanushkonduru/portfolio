export type SkillGroup = {
  id: string;
  name: string;
  items: string[];
  /** Wider tile in the grid. */
  wide?: boolean;
};

/**
 * The short list the page shows: the tools behind the work above, the ones
 * worth being asked about. Every name is taken from `skillGroups` as written.
 */
export const coreSkills: { id: string; name: string; items: string[] }[] = [
  {
    id: "llm",
    name: "LLM systems",
    items: [
      "LangGraph",
      "LangChain",
      "RAG Systems",
      "RAGAS Evaluation",
      "Multi-Agent Orchestration",
    ],
  },
  {
    id: "ml",
    name: "Machine learning",
    items: [
      "PyTorch",
      "Hugging Face Transformers",
      "LoRA Fine-Tuning",
      "scikit-learn",
      "Machine Unlearning",
    ],
  },
  {
    id: "backend",
    name: "Backend",
    items: [
      "Python",
      "Django REST Framework",
      "FastAPI",
      "PostgreSQL",
      "Multi-Tenant Architecture",
    ],
  },
  {
    id: "shipping",
    name: "Shipping",
    items: [
      "Docker",
      "GitHub Actions",
      "MLflow",
      "AWS App Runner",
      "GCP Cloud Run",
    ],
  },
];

/** The complete list, verbatim from the résumé's technical skills section.
    No additions. The page shows `coreSkills`; this is the record. */
export const skillGroups: SkillGroup[] = [
  {
    id: "llm",
    name: "LLM & Agentic Frameworks",
    wide: true,
    items: [
      "LangChain",
      "LangGraph",
      "LangSmith",
      "OpenAI API",
      "Groq API",
      "RAG Systems",
      "RAGAS Evaluation",
      "LLM Evaluation",
      "Multi-Agent Orchestration",
      "Prompt Engineering",
      "Function Calling",
      "Structured Outputs",
    ],
  },
  {
    id: "ml",
    name: "AI / Machine Learning",
    wide: true,
    items: [
      "PyTorch",
      "scikit-learn",
      "XGBoost",
      "pandas",
      "NumPy",
      "Deep Learning",
      "NLP",
      "Model Evaluation",
      "Hyperparameter Tuning",
      "Feature Engineering",
      "LoRA Fine-Tuning",
      "Hugging Face Transformers",
      "Machine Unlearning",
    ],
  },
  {
    id: "backend",
    name: "Backend Development",
    items: ["Django", "Django REST Framework", "FastAPI", "REST APIs"],
  },
  {
    id: "auth",
    name: "Auth & Architecture",
    items: [
      "Multi-Tenant Architecture",
      "RBAC",
      "JWT",
      "OTP",
      "API Key Authentication",
    ],
  },
  {
    id: "languages",
    name: "Languages",
    items: ["Python", "SQL", "Java", "JavaScript", "C/C++"],
  },
  {
    id: "data",
    name: "Databases",
    items: ["PostgreSQL", "Redis", "SQLite", "ChromaDB", "FAISS"],
  },
  {
    id: "mlops",
    name: "MLOps & DevOps",
    items: [
      "MLflow",
      "DVC",
      "Evidently AI",
      "Model Monitoring",
      "Docker",
      "GitHub Actions",
      "CI/CD",
      "Git",
    ],
  },
  {
    id: "cloud",
    name: "Cloud",
    items: [
      "AWS EC2",
      "AWS S3",
      "AWS App Runner",
      "GCP Cloud Build",
      "GCP Cloud Run",
    ],
  },
];

/** The short list that runs across the page as a marquee. */
export const headlineSkills = [
  "Python",
  "PyTorch",
  "LangGraph",
  "LangChain",
  "RAG",
  "RAGAS",
  "LoRA",
  "Django",
  "FastAPI",
  "PostgreSQL",
  "Docker",
  "MLflow",
  "AWS",
  "GCP",
];

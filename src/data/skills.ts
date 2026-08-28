export type SkillGroup = {
  id: string;
  name: string;
  /** What this cluster is actually used for, in his own work. */
  context: string;
  items: string[];
};

/** Verbatim from the résumé's technical skills section. No additions. */
export const skillGroups: SkillGroup[] = [
  {
    id: "llm",
    name: "LLM & Agentic Frameworks",
    context:
      "Where most of the recent work sits. Retrieval, orchestration, and the evaluation that decides whether either is actually working.",
    items: [
      "LangChain",
      "LangGraph",
      "LangSmith",
      "OpenAI API",
      "Groq API",
      "RAG Systems",
      "RAGAS Evaluation",
      "Prompt Engineering",
      "Function Calling",
      "Structured Outputs",
    ],
  },
  {
    id: "ml",
    name: "AI / Machine Learning",
    context:
      "From training a transformer from scratch to fine-tuning open checkpoints and benchmarking five models against each other.",
    items: [
      "PyTorch",
      "scikit-learn",
      "XGBoost",
      "pandas",
      "NumPy",
      "Jupyter",
      "Deep Learning",
      "NLP",
      "Model Evaluation",
      "Hyperparameter Tuning",
      "Feature Engineering",
      "LoRA Fine-Tuning",
      "HuggingFace Transformers",
    ],
  },
  {
    id: "backend",
    name: "Backend Development",
    context:
      "Production Django in a multi-tenant product, plus FastAPI for every model-serving surface.",
    items: [
      "Django",
      "Django REST Framework",
      "FastAPI",
      "Flask",
      "REST APIs",
      "Multi-Tenant Architecture",
      "RBAC",
      "JWT & OTP Auth",
      "API Key Auth",
    ],
  },
  {
    id: "languages",
    name: "Languages",
    context: "Python first; Java and C++ for data structures and coursework.",
    items: ["Python", "SQL", "Java", "JavaScript", "C++ / C", "HTML/CSS"],
  },
  {
    id: "data",
    name: "Databases",
    context:
      "Relational stores for products, vector stores for retrieval, Redis for agent state.",
    items: [
      "PostgreSQL",
      "MongoDB",
      "SQLite",
      "Supabase",
      "Redis",
      "ChromaDB",
      "Pinecone",
      "FAISS",
    ],
  },
  {
    id: "mlops",
    name: "MLOps & DevOps",
    context:
      "Tracking, versioning and drift monitoring. This is the part that makes a model operable rather than only trained.",
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
    context: "Where the internship backends and the RAG service actually run.",
    items: [
      "AWS EC2",
      "AWS S3",
      "AWS App Runner",
      "GCP Cloud Build",
      "GCP Cloud Run",
    ],
  },
];

/** Compact strip shown under the hero. */
export const marqueeTech = [
  "PyTorch",
  "LangGraph",
  "LangChain",
  "FastAPI",
  "Django",
  "PostgreSQL",
  "Docker",
  "MLflow",
  "ChromaDB",
  "XGBoost",
  "HuggingFace",
  "GCP Cloud Run",
  "AWS",
  "Redis",
  "DVC",
  "RAGAS",
  "LoRA",
  "Evidently AI",
];

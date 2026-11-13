/**
 * Single source of truth for identity, links and positioning copy.
 * Every claim here is drawn from the résumé, the repositories or the
 * published patent applications. Nothing is estimated.
 */

export const profile = {
  name: "Dhanush Konduru",
  initials: "DK",
  role: "AI/ML & Backend Engineer",
  roleLong: "Backend & Generative AI Engineer",

  /** Hero headline. The word in the middle is set in the accent face. */
  headline: { before: "AI systems that", accent: "prove", after: "what they claim." },

  /** One-line positioning statement under the headline. */
  positioning:
    "Backend and generative AI engineer. I ship multi-tenant Django services, build RAG and multi-agent systems that are scored with real evaluations, and research how to make a model verifiably forget.",

  /** The longer statement in the about section. From the résumé summary. */
  about:
    "I’m a backend and generative AI engineer finishing an Integrated M.Tech at VIT Vellore. Three internships have taken me through production multi-tenant Django services, LLM fine-tuning with PyTorch and LoRA, and model evaluation. Alongside that I do applied research, and I’m a co-inventor on five published Indian patent applications, three of them in machine unlearning. I would rather measure a claim than assert it.",

  location: "Vellore, Tamil Nadu, India",
  availability: "Open to 2027 new-grad and internship roles",
  site: "dhanushkonduru.vercel.app",

  email: "dhanushkonduru@gmail.com",
  phone: "+91 96767 59973",

  links: {
    github: "https://github.com/dhanushkonduru",
    linkedin: "https://www.linkedin.com/in/dhanushkonduru/",
    leetcode: "https://leetcode.com/u/DhanushKonduru",
    email: "mailto:dhanushkonduru@gmail.com",
  },

  resume: {
    href: "/Dhanush-Konduru-Resume.pdf",
    label: "Résumé",
  },

  /** Facts taken from the résumé and the published applications. */
  markers: [
    { value: "5", label: "Published patent applications" },
    { value: "3", label: "Engineering internships" },
    { value: "0.71 → 0.89", label: "RAGAS faithfulness, 50-question set" },
    { value: "10.9×", label: "Faster unlearning than retraining" },
  ],

  education: {
    school: "Vellore Institute of Technology",
    degree: "Integrated M.Tech, Software Engineering",
    period: "2022 – 2027",
  },
} as const;

export const seo = {
  title: "Dhanush Konduru · AI/ML & Backend Engineer",
  description:
    "Backend and generative AI engineer. Multi-tenant Django services in production, RAG and multi-agent systems scored with RAGAS, and five published Indian patent applications, three of them in machine unlearning. Integrated M.Tech, VIT Vellore.",
  keywords: [
    "Dhanush Konduru",
    "AI/ML engineer",
    "machine unlearning",
    "RAG engineer",
    "LangGraph",
    "LangChain",
    "Django backend engineer",
    "multi-agent systems",
    "LLM evaluation",
    "VIT Vellore",
    "MLOps",
    "FastAPI",
  ],
  /**
   * Canonical origin. Drives metadataBase, Open Graph, sitemap and robots.
   * Set NEXT_PUBLIC_SITE_URL at deploy time, or edit the fallback below.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://dhanushkonduru.vercel.app",
} as const;

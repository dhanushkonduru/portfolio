/**
 * Single source of truth for identity, links and positioning copy.
 * Every claim here is drawn from the résumé, the repositories or the
 * invention-disclosure filings. Nothing is estimated.
 */

export const profile = {
  name: "Dhanush Konduru",
  initials: "DK",
  role: "AI/ML & Software Engineer",
  roleLong: "AI/ML Engineer · Backend Systems · Applied Research",

  /** Hero headline, split for line-by-line animation. */
  headline: ["Systems that", "prove what", "they claim."],

  /** One-line positioning statement. */
  positioning:
    "I work across three layers: Django backends running in production, RAG and multi-agent systems built on top of them, and applied research on machine unlearning. What connects them is that I would rather measure a claim than assert it.",

  /** Short supporting paragraph for the hero. */
  support:
    "Integrated M.Tech at VIT Vellore. Three engineering internships across LLM evaluation, RAG and multi-tenant Django backends. Two first-named invention disclosures on machine-unlearning verification, both cleared as patentable after a formal prior-art search.",

  location: "Vellore, Tamil Nadu, India",
  availability: "Open to 2027 new-grad and internship roles",

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

  /** Facts asserted verbatim from the résumé. */
  markers: [
    { value: "3", label: "Engineering internships" },
    { value: "2", label: "Invention disclosures" },
    { value: "40%", label: "Retrieval token cost cut" },
    { value: "1st", label: "HackX 3.0, VIT Vellore" },
  ],
} as const;

export const seo = {
  title: "Dhanush Konduru · AI/ML & Software Engineer",
  description:
    "AI/ML and software engineer working on verifiable machine learning: RAG systems with traceable citations, multi-agent pipelines, and machine-unlearning verification. Integrated M.Tech, VIT Vellore.",
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
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://dhanush-konduru.vercel.app",
} as const;

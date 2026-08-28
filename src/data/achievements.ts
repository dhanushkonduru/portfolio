export type Achievement = {
  id: string;
  rank: string;
  tone: "gold" | "silver";
  event: string;
  detail: string;
  year: string;
};

export const achievements: Achievement[] = [
  {
    id: "hackx",
    rank: "1st Place",
    tone: "gold",
    event: "HackX 3.0, GraVITas'25, VIT Vellore",
    detail: "Oracle-sponsored annual techno-management fest",
    year: "2025",
  },
  {
    id: "icadt",
    rank: "Jury Mention",
    tone: "silver",
    event: "ICADT'25 National Level Hackathon, VIT Vellore",
    detail: "Springer / AdroIT Technologies",
    year: "2025",
  },
  {
    id: "nnrg",
    rank: "3rd Place",
    tone: "silver",
    event: "National Level Hackathon on Generative AI, NNRG Hyderabad",
    detail: "IIIC & IIC",
    year: "2024",
  },
];

export type Certification = {
  name: string;
  issuer: string;
};

export const certifications: Certification[] = [
  {
    name: "Machine Learning Specialization",
    issuer: "Stanford / DeepLearning.AI",
  },
  { name: "Deep Learning Fundamentals", issuer: "NVIDIA" },
  { name: "Oracle Generative AI", issuer: "Oracle" },
  { name: "Prompt Engineering", issuer: "Vanderbilt" },
];

export type Patent = {
  id: string;
  /** Title as it reads on the résumé. */
  title: string;
  /** Two or three words for tight layouts. */
  short: string;
  application: string;
  filed: string;
  published: string;
  /** Anything past publication, e.g. a request for examination. */
  extra?: string;
  applicant: string;
  /** In the order they appear on the published application. */
  inventors: string[];
  domain: string;
  summary: string;
  /** Measured results stated in the filing. Empty where none are claimed. */
  figures: { value: string; label: string }[];
};

/**
 * Five Indian patent applications, all published. Numbers, dates and inventor
 * order are taken from the front page of each published application; the
 * summaries and results follow the résumé.
 */
export const patents: Patent[] = [
  {
    id: "patent-unlearning",
    title:
      "Verification-Gated Machine Unlearning for Language Model Synchronization",
    short: "LLM unlearning",
    application: "202641110058",
    filed: "14 Sep 2026",
    published: "18 Sep 2026",
    applicant: "Vellore Institute of Technology",
    inventors: ["Dr M Rajasekhara Babu", "Dhanush Konduru", "Dr Nirmala M"],
    domain: "Machine unlearning · Language models",
    summary:
      "An engine that keeps a language model in sync with a versioned dataset: it learns the records that were added and unlearns the ones that were removed, without retraining from scratch. The model is released only after a behavioral audit, a trust score and a relearning-resistance test against a retrained oracle all pass, with a forgetting verdict reported for every removed record set.",
    figures: [
      {
        value: "56–97%",
        label: "knowledge recovered from loss-certified baselines",
      },
      { value: "22%", label: "recovered after retraining from scratch" },
    ],
  },
  {
    id: "patent-aeroforge",
    title:
      "Rapid Machine Unlearning in Digital Twins for Continuous Fleet Governance and Adversarial Verification",
    short: "Fleet digital twins",
    application: "202641110298",
    filed: "14 Sep 2026",
    published: "18 Sep 2026",
    extra: "Examination requested 16 Sep 2026",
    applicant: "Vellore Institute of Technology",
    inventors: ["Dr M Rajasekhara Babu", "Dhanush Konduru"],
    domain: "Machine unlearning · Turbofan prognostics",
    summary:
      "A system that removes one contributor’s telemetry from turbofan remaining-useful-life models while the fleet stays monitored. Scope is resolved by provenance lookup instead of similarity search, and a retrained-oracle recovery attack withholds any model that only hides the data. Validated on a 460-engine NASA C-MAPSS fleet.",
    figures: [
      { value: "10.9×", label: "faster than retraining (4.5 s vs 48.9 s)" },
      { value: "7.2 ms", label: "to resolve what must be forgotten" },
    ],
  },
  {
    id: "patent-diagnostic",
    title:
      "System and Method for Governing a Diagnostic Network with Verified Selective Unlearning",
    short: "ECG diagnostics",
    application: "202641126815",
    filed: "24 Oct 2026",
    published: "30 Oct 2026",
    applicant: "Vellore Institute of Technology",
    inventors: ["Dr M Rajasekhara Babu", "Dhanush Konduru"],
    domain: "Machine unlearning · Clinical ECG",
    summary:
      "A system that removes a withdrawn party’s ECG recordings from a diagnostic network by indexed provenance lookup. A separability probe refuses requests that cannot be honoured, and the updated model is withheld unless an oracle-calibrated relearning attack passes, while inference stays online.",
    figures: [
      { value: "3.0–9.5×", label: "faster removal than retraining" },
    ],
  },
  {
    id: "patent-geospatial",
    title:
      "Evidence-Gated Geospatial Decision-Control System for Predictive Urban-Growth-Aware Facility Planning",
    short: "Facility siting",
    application: "202641116651",
    filed: "29 Sep 2026",
    published: "09 Oct 2026",
    applicant: "Vellore Institute of Technology",
    inventors: ["Sushanth Sj", "Dhanush Konduru", "Anusha Buchupalli"],
    domain: "Geospatial ML · Urban planning",
    summary:
      "A facility-siting system that lets a predicted urban-growth layer into site scoring only when a withheld-year replay beats a no-change benchmark. Candidate zones are then ranked by counterfactual impact and by how stable the ranking is.",
    figures: [],
  },
  {
    id: "patent-coronary",
    title:
      "System for Linkage-Conditioned Multimodal Fusion and Capability-Gated Coronary Anatomical Assertion Control",
    short: "Coronary digital twin",
    application: "202641131068",
    filed: "02 Nov 2026",
    published: "06 Nov 2026",
    applicant: "Vellore Institute of Technology",
    inventors: ["Dr M Rajasekhara Babu", "Dhanush Konduru"],
    domain: "Multimodal ML · Cardiology",
    summary:
      "A system that applies trained multimodal fusion only when the cardiac evidence is verified to come from the same subject, and otherwise falls back to reliability-weighted aggregation flagged as unvalidated. Coronary findings are authorised at subject, vessel or segment level only when capability and consistency conditions are met, then shown on a 3D digital twin.",
    figures: [],
  },
];

export type Paper = {
  id: string;
  title: string;
  venue: string;
  status: string;
  authors: string;
  position: string;
  area: string;
  summary: string;
  contribution: string;
};

export const papers: Paper[] = [
  {
    id: "paper-unlearning",
    title:
      "Behavioural and Adversarial Verification of Machine Unlearning in Language Models",
    venue: "Manuscript",
    status: "Under submission",
    authors: "Dhanush Konduru, Rajasekhar Babu M, Nirmala M",
    position: "First author",
    area: "Trustworthy machine learning",
    summary:
      "A five-probe behavioural audit and a value-based leak detector combined into a single trustworthiness score, which is then attacked with membership inference and a relearning attempt and graded against a retrained reference model.",
    contribution:
      "Designed the framework, built the pipeline, ran every experiment across three seeds and wrote the manuscript.",
  },
  {
    id: "paper-urban",
    title:
      "Integrated CA-ANN Urban Growth Modelling and AHP Suitability Analysis for Hospital Siting",
    venue: "Frontiers in Sustainable Cities",
    status: "Under revision",
    authors: "Author team, VIT Vellore",
    position: "Co-author",
    area: "Geospatial modelling · Urban health",
    summary:
      "Identifies where Vellore should add hospital capacity for its 2030–2035 growth horizon by treating predicted urban growth as a weighted siting criterion, validated by hindcasting a withheld epoch.",
    contribution:
      "Built the reproducible geospatial pipeline: LULC classification, the CA-ANN growth model, the AHP analysis and both validation stages.",
  },
  {
    id: "paper-blockchain",
    title:
      "A Secure and Efficient Blockchain-Based Storage System for High-Resolution Images Using IPFS, JPEG XL Compression and BLAKE3 Hashing with RBAC",
    venue: "Manuscript",
    status: "Under submission",
    authors:
      "Ujwal Kumar, Madhu Viswanatham V, M Rajasekhara Babu, Dhanush Konduru",
    position: "Co-author",
    area: "Decentralised storage · Access control",
    summary:
      "Combines JPEG XL compression, IPFS distribution, BLAKE3 content hashing and smart-contract RBAC so high-resolution image collections can be stored cheaply, verified independently and gated by role.",
    contribution: "Contributing author on the system design and evaluation.",
  },
];

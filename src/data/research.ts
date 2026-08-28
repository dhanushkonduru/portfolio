export type Patent = {
  id: string;
  title: string;
  ipr: string;
  status: string;
  statusTone: "cleared" | "pending";
  authors: string;
  authorNote: string;
  area: string;
  summary: string;
  contribution: string;
  finding: string;
  searchReport: string;
};

/** Both filings are invention disclosures with patentability cleared after
 *  formal prior-art search. Wording follows the résumé exactly. */
export const patents: Patent[] = [
  {
    id: "patent-unlearning",
    title:
      "Trustworthy Machine Unlearning Through Multi-Prompt Behavioural Assessment for Large Language Models",
    ipr: "VIT IPR ID IPR0005034P",
    status: "Patentability cleared",
    statusTone: "cleared",
    authors: "Dhanush Konduru, Rajasekhar Babu M, Nirmala M",
    authorNote: "First-named inventor",
    area: "Machine unlearning · LLM verification",
    summary:
      "A verification-gated engine that diffs two dataset versions, unlearns the removed records and learns the added ones on one model without retraining, then withholds it until a multi-probe behavioural audit and an adversarial relearning test both pass.",
    contribution:
      "Conceived the multi-prompt behavioural assessment, built the reference implementation and ran the evaluation that produced the filing's central result.",
    finding:
      "Fine-tuning an unlearned model on a few deleted records brought back 56 to 97 percent of the knowledge that was meant to be gone, against 22 percent for a from-scratch retrain. Every method tested would have certified itself had it not been challenged.",
    searchReport:
      "Patentability search report PAT/2026/1217, issued August 2026. Cleared on novelty, inventive step and the Section 3(k) software exclusion.",
  },
  {
    id: "patent-aeroforge",
    title:
      "AeroForge: Rapid-Unlearning Digital Twin System for Continuous Fleet Governance and Adversarial Verification",
    ipr: "VIT IPR ID IPR0005230P",
    status: "Patentability cleared",
    statusTone: "cleared",
    authors: "Dhanush Konduru, Rajasekhar Babu M",
    authorNote: "First-named inventor",
    area: "Digital twins · Fleet prognostics",
    summary:
      "Carries the verification-gated approach into turbofan fleet prognostics: a departing operator's telemetry is stripped out of a remaining-life model in roughly a tenth of the retraining time the previously approved route required, while the model stays in service so fleet monitoring never pauses.",
    contribution:
      "Designed the provenance-indexed erasure path and the feasibility check, and built both domain implementations: turbofan prognostics, then a second-domain port to diagnostic ECG.",
    finding:
      "Provenance indexing resolves an erasure request by lookup rather than similarity search, and a feasibility check refuses the request outright when the departing operator's engines are statistically indistinguishable from the rest of the aircraft on the same monitoring contract.",
    searchReport:
      "Prior-art search report issued August 2026; assessed patentable on both novelty and inventive step.",
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
      "The study behind the first invention disclosure: a five-probe behavioural audit and a value-based leak detector combined into an unlearning effectiveness score, a knowledge retention ratio, a behavioural consistency measure and a single trustworthiness score. That verdict is then attacked with membership inference and a relearning attempt, graded against a retrained reference model.",
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
      "Identifies where Vellore should add hospital capacity for its 2030–2035 growth horizon by treating predicted urban growth as a weighted siting criterion, validated by hindcasting a withheld epoch and by running the siting analysis with and without the growth criterion.",
    contribution:
      "Built the reproducible geospatial pipeline: LULC classification, the CA-ANN growth model, the AHP analysis and both validation stages.",
  },
  {
    id: "paper-blockchain",
    title:
      "A Secure and Efficient Blockchain-Based Storage System for High-Resolution Images Using IPFS, JPEG XL Compression and BLAKE3 Hashing with RBAC",
    venue: "Manuscript",
    status: "Under submission",
    authors: "Ujwal Kumar, Madhu Viswanatham V, M Rajasekhara Babu, Dhanush Konduru",
    position: "Co-author",
    area: "Decentralised storage · Access control",
    summary:
      "Combines JPEG XL compression, IPFS distribution, BLAKE3 content hashing and smart-contract RBAC so high-resolution image collections can be stored cheaply, verified independently and gated by role. Compression ratios between 3:1 and 5:1 were measured, and retrieval times fell by roughly a third against older formats.",
    contribution:
      "Contributing author on the system design and evaluation.",
  },
];

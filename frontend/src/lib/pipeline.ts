/* -------------------------------------------------------------------------- */
/*                           Pipeline stage model                            */
/* -------------------------------------------------------------------------- */

export type StageId =
  | "wishlist"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected";

export interface StageDef {
  id: StageId;
  label: string;
  description: string;
  accent: string; // tailwind text color class
  ring: string;   // ring / border color when active
  bg: string;     // column header accent bg
}

export const STAGES: StageDef[] = [
  {
    id: "wishlist",
    label: "Wishlist",
    description: "Roles you want to apply to",
    accent: "text-ink-muted",
    ring: "ring-white/10",
    bg: "bg-white/[0.04]",
  },
  {
    id: "applied",
    label: "Applied",
    description: "Submitted and waiting for response",
    accent: "text-info",
    ring: "ring-info/40",
    bg: "bg-info/[0.06]",
  },
  {
    id: "screening",
    label: "Screening",
    description: "Recruiter phone screen scheduled",
    accent: "text-amber-300",
    ring: "ring-amber-400/40",
    bg: "bg-amber-400/[0.06]",
  },
  {
    id: "interview",
    label: "Interview",
    description: "Technical / onsite rounds",
    accent: "text-accent-300",
    ring: "ring-accent-400/40",
    bg: "bg-accent-500/[0.06]",
  },
  {
    id: "offer",
    label: "Offer",
    description: "Negotiating or signed",
    accent: "text-success",
    ring: "ring-success/40",
    bg: "bg-success/[0.06]",
  },
  {
    id: "rejected",
    label: "Rejected",
    description: "Closed — learning opportunity",
    accent: "text-danger",
    ring: "ring-danger/40",
    bg: "bg-danger/[0.06]",
  },
];

/**
 * Map any backend status string onto a pipeline stage.
 */
export function stageFromStatus(status?: string): StageId {
  const s = (status || "").toLowerCase();
  if (["wishlist", "saved", "draft"].includes(s)) return "wishlist";
  if (["applied", "submitted", "sent"].includes(s)) return "applied";
  if (["screening", "phone_screen", "review", "in_review"].includes(s))
    return "screening";
  if (["interview", "interviewing", "onsite"].includes(s)) return "interview";
  if (["offer", "accepted", "negotiating", "hired"].includes(s)) return "offer";
  if (["rejected", "declined", "closed", "ghosted"].includes(s))
    return "rejected";
  // Default: anything pending/tailoring/processing/ready goes to Applied
  return "applied";
}

/* -------------------------------------------------------------------------- */
/*                              Demo / seed data                              */
/* -------------------------------------------------------------------------- */

export interface ApplicationItem {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  remote?: boolean;
  matchScore: number;
  stage: StageId;
  daysIn: number;        // days since entered current stage
  appliedOn?: string;    // ISO date string
  ats?: {
    score: number;
    readability: number;
    strength: number;
    risk: "low" | "medium" | "high";
    presentKeywords: string[];
    missingKeywords: string[];
    recruiterNotes: string;
    fitExplanation: string;
    improvements: { priority: "high" | "medium" | "low"; title: string; body: string }[];
  };
  notes?: string;
}

export const DEMO_APPLICATIONS: ApplicationItem[] = [
  {
    id: "1",
    title: "Senior Python Developer",
    company: "TechCorp",
    location: "Toronto, ON",
    salary: "$140k – $170k",
    remote: false,
    matchScore: 92,
    stage: "interview",
    daysIn: 3,
    appliedOn: "2026-05-12",
    ats: {
      score: 92, readability: 88, strength: 85, risk: "low",
      presentKeywords: ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "REST", "CI/CD", "Linux"],
      missingKeywords: ["Kubernetes", "gRPC"],
      recruiterNotes:
        "Strong backend profile with clear impact metrics. The candidate demonstrates ownership end-to-end, from system design to production. Recommend fast-tracking to onsite.",
      fitExplanation:
        "Your experience building high-throughput FastAPI services in production directly maps to TechCorp's core platform. The 40% latency reduction at CloudBase is exactly the kind of outcome this team needs.",
      improvements: [
        { priority: "high", title: "Add Kubernetes exposure", body: "List any production k8s work — even observability / debugging counts." },
        { priority: "medium", title: "Quantify FastAPI scale", body: "Mention request/sec or p99 latency alongside the 40% figure." },
        { priority: "low", title: "Soften the legacy migration bullet", body: "Lead with the win, mention legacy as context." },
      ],
    },
  },
  {
    id: "2",
    title: "Lead Backend Engineer",
    company: "DataFlow",
    location: "Vancouver, BC",
    salary: "$160k – $195k",
    remote: true,
    matchScore: 88,
    stage: "screening",
    daysIn: 5,
    appliedOn: "2026-05-08",
    ats: {
      score: 88, readability: 91, strength: 82, risk: "low",
      presentKeywords: ["Python", "PostgreSQL", "Redis", "Microservices", "AWS", "Kafka"],
      missingKeywords: ["Data pipelines", "Airflow", "dbt"],
      recruiterNotes:
        "Excellent systems thinking. Some gaps around data-engineering tooling, but the engineering fundamentals are clearly there.",
      fitExplanation:
        "Strong fit for the platform side of DataFlow's stack. The data-pipeline tooling is learnable on the job for a backend lead at your level.",
      improvements: [
        { priority: "high", title: "Add a data project", body: "Even a side project using Airflow or dbt will close the gap." },
        { priority: "medium", title: "Mention streaming experience", body: "Kafka is on your resume — quantify throughput." },
      ],
    },
  },
  {
    id: "3",
    title: "Full-Stack Engineer",
    company: "CloudBase",
    location: "Remote (Canada)",
    salary: "$130k – $155k",
    remote: true,
    matchScore: 85,
    stage: "applied",
    daysIn: 2,
    appliedOn: "2026-05-20",
  },
  {
    id: "4",
    title: "DevOps Engineer",
    company: "Infra.io",
    location: "Montreal, QC",
    salary: "$120k – $145k",
    remote: false,
    matchScore: 81,
    stage: "applied",
    daysIn: 7,
    appliedOn: "2026-05-15",
  },
  {
    id: "5",
    title: "Staff Software Engineer",
    company: "NorthBay AI",
    location: "Ottawa, ON",
    salary: "$180k – $220k",
    remote: true,
    matchScore: 89,
    stage: "wishlist",
    daysIn: 0,
  },
  {
    id: "6",
    title: "Senior Software Engineer",
    company: "Maple Health",
    location: "Toronto, ON",
    salary: "$135k – $165k",
    remote: false,
    matchScore: 76,
    stage: "wishlist",
    daysIn: 0,
  },
  {
    id: "7",
    title: "Backend Engineer",
    company: "FinPulse",
    location: "Remote (Canada)",
    salary: "$125k – $150k",
    remote: true,
    matchScore: 84,
    stage: "offer",
    daysIn: 1,
    appliedOn: "2026-04-28",
  },
  {
    id: "8",
    title: "Software Engineer II",
    company: "RetailCo",
    location: "Calgary, AB",
    salary: "$110k – $135k",
    remote: false,
    matchScore: 68,
    stage: "rejected",
    daysIn: 14,
    appliedOn: "2026-04-20",
  },
  {
    id: "9",
    title: "Platform Engineer",
    company: "Streamline",
    location: "Remote (Canada)",
    salary: "$140k – $170k",
    remote: true,
    matchScore: 86,
    stage: "screening",
    daysIn: 4,
    appliedOn: "2026-05-09",
  },
];

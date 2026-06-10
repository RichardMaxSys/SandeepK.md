import { describe, it, expect } from "vitest";
import { runAts, GENERIC_PHRASES } from "@/lib/ats-engine";
import { EMPTY_RESUME, type ResumeData } from "@/lib/resume-store";

/* -------------------------------------------------------------------------- */
/*                              Fixtures                                      */
/* -------------------------------------------------------------------------- */

const STRONG_RESUME: ResumeData = {
  contact: {
    name: "Sandeep K",
    title: "Senior Software Engineer",
    email: "sandeep.k@icloud.com",
    phone: "+1 416 555 0123",
    location: "Toronto, ON",
  },
  summary:
    "Senior software engineer with 7 years building production Python services. Cut p99 latency by 40% via async pipeline redesign. Shipped FastAPI platform handling 2M daily requests with 99.95% uptime. Mentored 4 engineers promoted to senior in 2024.",
  experience: [
    {
      id: "e1", company: "CloudBase", role: "Senior Software Engineer", location: "Toronto, ON",
      start: "2022", end: "Present",
      bullets: [
        "Built FastAPI platform handling 2M daily requests with 99.95% uptime",
        "Cut p99 latency by 40% via async pipeline + Redis caching",
        "Led migration of legacy monolith to microservices across 4 teams",
        "Mentored 4 mid-level engineers; 2 promoted to senior in 2024",
      ],
    },
    {
      id: "e2", company: "Maple Health", role: "Software Engineer", location: "Toronto, ON",
      start: "2019", end: "2022",
      bullets: [
        "Built patient-facing API serving 800k daily active users",
        "Reduced infrastructure cost by 32% via GCP rightsizing",
        "Introduced CI/CD pipelines reducing deploy time from 45 min to 6 min",
      ],
    },
  ],
  education: [
    { id: "edu1", school: "University of Toronto", degree: "B.Sc.", field: "Computer Science", start: "2014", end: "2018" },
  ],
  skills: ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "Kubernetes", "AWS", "GCP", "Linux"],
  projects: [
    { id: "p1", name: "openrec", description: "Open-source recommendation engine (3.2k stars)", bullets: ["Built async pipeline processing 50k events/sec"], tech: ["Python", "FastAPI"] },
  ],
  certifications: [],
};

const WEAK_RESUME: ResumeData = {
  ...EMPTY_RESUME,
  contact: { name: "Anon", title: "", email: "", phone: "", location: "" },
  summary: "Passionate team player. Hard worker. Results-driven. Self-starter. Best-in-class.",
  experience: [],
  education: [],
  skills: [],
};

/* -------------------------------------------------------------------------- */
/*                              Core scoring                                  */
/* -------------------------------------------------------------------------- */

describe("runAts — overall shape", () => {
  it("returns a valid report structure for any input", () => {
    const r = runAts(STRONG_RESUME);
    expect(r.overall).toBeGreaterThanOrEqual(0);
    expect(r.overall).toBeLessThanOrEqual(100);
    expect(r.dimensions.parseability).toBeDefined();
    expect(r.dimensions.keywords).toBeDefined();
    expect(r.dimensions.formatting).toBeDefined();
    expect(r.dimensions.content).toBeDefined();
    expect(r.totalBullets).toBe(STRONG_RESUME.experience.reduce((a, e) => a + e.bullets.filter(Boolean).length, 0) + 1);
  });

  it("strong resume scores significantly higher than empty resume", () => {
    const strong = runAts(STRONG_RESUME);
    // Use a TRULY empty resume, not EMPTY_RESUME which has demo data
    const trulyEmpty: ResumeData = {
      contact: { name: "", title: "", email: "", phone: "", location: "" },
      summary: "",
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
    };
    const empty = runAts(trulyEmpty);
    expect(strong.overall).toBeGreaterThan(empty.overall + 20);
  });

  it("strong resume scores >= 70", () => {
    const r = runAts(STRONG_RESUME);
    expect(r.overall).toBeGreaterThanOrEqual(70);
  });
});

/* -------------------------------------------------------------------------- */
/*                              Parseability                                  */
/* -------------------------------------------------------------------------- */

describe("ATS — parseability dimension", () => {
  it("deducts for missing email", () => {
    const noEmail: ResumeData = { ...STRONG_RESUME, contact: { ...STRONG_RESUME.contact, email: "" } };
    const r = runAts(noEmail);
    expect(r.dimensions.parseability.score).toBeLessThan(runAts(STRONG_RESUME).dimensions.parseability.score);
    expect(r.dimensions.parseability.findings.some((f) => f.toLowerCase().includes("email"))).toBe(true);
  });

  it("deducts heavily for no experience", () => {
    const noExp: ResumeData = { ...STRONG_RESUME, experience: [] };
    const r = runAts(noExp);
    expect(r.dimensions.parseability.findings.some((f) => f.toLowerCase().includes("experience"))).toBe(true);
  });

  it("deducts for missing dates on experience", () => {
    const noDates: ResumeData = {
      ...STRONG_RESUME,
      experience: STRONG_RESUME.experience.map((e) => ({ ...e, start: "", end: "" })),
    };
    const r = runAts(noDates);
    // Missing-dates check lives in the formatting dimension
    expect(r.dimensions.formatting.findings.some((f) => f.toLowerCase().includes("date"))).toBe(true);
  });

  it("warns when resume is very short", () => {
    const short: ResumeData = {
      ...STRONG_RESUME,
      summary: "Short.",
      experience: [{
        id: "x", company: "X", role: "X", location: "", start: "2020", end: "2021", bullets: ["Did stuff."],
      }],
      skills: ["A"],
    };
    const r = runAts(short);
    expect(r.dimensions.parseability.findings.some((f) => f.toLowerCase().includes("short"))).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/*                              Keywords                                      */
/* -------------------------------------------------------------------------- */

describe("ATS — keyword dimension", () => {
  it("matches JD keywords against resume tokens", () => {
    const jd = "Looking for a Python developer with FastAPI and PostgreSQL experience. Must know Docker and Kubernetes.";
    const r = runAts(STRONG_RESUME, jd);
    // STRONG_RESUME contains Python, FastAPI, PostgreSQL, Docker, Kubernetes
    // so the keyword score should be high (> 50% of the top JD tokens)
    expect(r.dimensions.keywords.score).toBeGreaterThan(35);
    expect(r.dimensions.keywords.positiveSignals.some((s) => s.includes("present"))).toBe(true);
  });

  it("reports missing keywords when not in resume", () => {
    const jd = "Must have Rust, Elixir, and OCaml experience with extensive Haskell background.";
    const r = runAts(STRONG_RESUME, jd);
    expect(r.dimensions.keywords.score).toBeLessThan(20);
    expect(r.dimensions.keywords.findings.some((f) => f.toLowerCase().includes("missing"))).toBe(true);
  });

  it("falls back to baseline scoring when no JD given", () => {
    const r = runAts(STRONG_RESUME);
    expect(r.dimensions.keywords.label).toBe("Keyword Coverage");
    expect(r.dimensions.keywords.findings.length + r.dimensions.keywords.positiveSignals.length).toBeGreaterThan(0);
  });

  it("handles a blank JD gracefully", () => {
    const r = runAts(STRONG_RESUME, "");
    expect(r.dimensions.keywords.score).toBeGreaterThanOrEqual(0);
  });
});

/* -------------------------------------------------------------------------- */
/*                              Formatting                                    */
/* -------------------------------------------------------------------------- */

describe("ATS — formatting dimension", () => {
  it("rewards having structured bullets", () => {
    const r = runAts(STRONG_RESUME);
    expect(r.dimensions.formatting.positiveSignals.some((s) => /bullet/i.test(s))).toBe(true);
  });

  it("penalizes too few skills", () => {
    const fewSkills: ResumeData = { ...STRONG_RESUME, skills: ["Python"] };
    const r = runAts(fewSkills);
    expect(r.dimensions.formatting.findings.some((f) => /skill/i.test(f))).toBe(true);
  });

  it("penalizes too many skills", () => {
    const manySkills: ResumeData = { ...STRONG_RESUME, skills: Array.from({ length: 40 }, (_, i) => `skill-${i}`) };
    const r = runAts(manySkills);
    expect(r.dimensions.formatting.findings.some((f) => /skill/i.test(f))).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/*                              Content quality                               */
/* -------------------------------------------------------------------------- */

describe("ATS — content quality dimension", () => {
  it("rewards quantified bullets", () => {
    const r = runAts(STRONG_RESUME);
    expect(r.quantifiedBullets / r.totalBullets).toBeGreaterThan(0.5);
  });

  it("flags weak lead-verb bullets", () => {
    const weak: ResumeData = {
      ...STRONG_RESUME,
      experience: [{
        id: "e1", company: "X", role: "X", location: "", start: "2020", end: "2021",
        bullets: [
          "Was responsible for backend code",
          "Helped with testing and QA",
          "Duties included writing documentation",
        ],
      }],
    };
    const r = runAts(weak);
    expect(r.dimensions.content.findings.some((f) => /weak verb|action verb/i.test(f))).toBe(true);
  });

  it("flags generic phrases for the humanizer", () => {
    const r = runAts(WEAK_RESUME);
    expect(r.humanizer.genericPhraseCount).toBeGreaterThanOrEqual(3);
    expect(r.humanizer.flaggedPhrases.some((p) => p.phrase === "passionate")).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/*                              Humanizer phrase bank                         */
/* -------------------------------------------------------------------------- */

describe("humanizer phrase bank", () => {
  it("contains expected entries", () => {
    const phrases = GENERIC_PHRASES.map((g) => g.phrase);
    for (const expected of ["passionate", "results-driven", "team player", "rockstar", "ninja", "guru"]) {
      expect(phrases).toContain(expected);
    }
  });

  it("each phrase has a `why` and a `better` field", () => {
    for (const g of GENERIC_PHRASES) {
      expect(g.why.length).toBeGreaterThan(10);
      expect(g.better.length).toBeGreaterThan(10);
    }
  });
});

/* -------------------------------------------------------------------------- */
/*                              Determinism                                   */
/* -------------------------------------------------------------------------- */

describe("determinism", () => {
  it("produces identical reports on identical input", () => {
    const a = runAts(STRONG_RESUME);
    const b = runAts(STRONG_RESUME);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("produces identical reports with the same JD", () => {
    const jd = "Python, FastAPI, Kubernetes, AWS";
    const a = runAts(STRONG_RESUME, jd);
    const b = runAts(STRONG_RESUME, jd);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

/* -------------------------------------------------------------------------- */
/*                              Edge cases                                    */
/* -------------------------------------------------------------------------- */

describe("edge cases", () => {
  it("handles a resume with only one section filled", () => {
    const r = runAts({ ...EMPTY_RESUME, contact: { ...EMPTY_RESUME.contact, name: "Test", email: "a@b.co" } });
    expect(r.overall).toBeGreaterThanOrEqual(0);
    expect(r.overall).toBeLessThanOrEqual(100);
  });

  it("does not crash on whitespace-only JD", () => {
    expect(() => runAts(STRONG_RESUME, "    \n\n   ")).not.toThrow();
  });

  it("does not crash on resume with empty bullets array", () => {
    const r = runAts({ ...STRONG_RESUME, experience: [{ ...STRONG_RESUME.experience[0], bullets: [] }] });
    expect(r.overall).toBeGreaterThanOrEqual(0);
  });
});

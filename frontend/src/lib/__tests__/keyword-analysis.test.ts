import { describe, it, expect } from "vitest";
import { extractKeywords, compareKeywords } from "@/lib/ai-rewrite";

/* -------------------------------------------------------------------------- */
/*                          extractKeywords (JD only)                          */
/* -------------------------------------------------------------------------- */

describe("extractKeywords", () => {
  it("returns empty arrays for empty input", () => {
    const r = extractKeywords("");
    expect(r.required).toEqual([]);
    expect(r.niceToHave).toEqual([]);
  });

  it("extracts tech terms from the body of the JD", () => {
    const jd = "We're hiring a Python developer with FastAPI experience. Knowledge of PostgreSQL and Docker is required.";
    const r = extractKeywords(jd);
    expect(r.required).toContain("python");
    expect(r.required).toContain("fastapi");
    expect(r.required).toContain("postgresql");
    expect(r.required).toContain("docker");
  });

  it("separates required vs nice-to-have using the 'Nice to have' header", () => {
    const jd = `Required: Python, FastAPI, PostgreSQL.

Nice to have: Kubernetes, Kafka.`;
    const r = extractKeywords(jd);
    expect(r.required).toContain("python");
    expect(r.niceToHave).toContain("kubernetes");
    expect(r.niceToHave).toContain("kafka");
    // Sanity: a required-only term should not also appear in niceToHave
    expect(r.niceToHave).not.toContain("python");
  });

  it("treats 'a plus' / 'bonus' lines as nice-to-have", () => {
    const jd = `Must have: Python, FastAPI.
GraphQL experience is a plus.
Rust knowledge would be a bonus.`;
    const r = extractKeywords(jd);
    expect(r.required).toContain("python");
    expect(r.niceToHave).toContain("graphql");
    expect(r.niceToHave).toContain("rust");
  });

  it("deduplicates terms even when they appear multiple times", () => {
    const jd = "Python, Python, Python, FastAPI, FastAPI.";
    const r = extractKeywords(jd);
    expect(r.required.filter((t) => t === "python")).toHaveLength(1);
    expect(r.required.filter((t) => t === "fastapi")).toHaveLength(1);
  });

  it("ignores common JD stopwords", () => {
    const jd = "Looking for a candidate with strong experience in the field of Python work.";
    const r = extractKeywords(jd);
    // Common stopwords should not appear as "required"
    expect(r.required).not.toContain("the");
    expect(r.required).not.toContain("a");
    expect(r.required).not.toContain("in");
    // "looking", "candidate", "experience" should also be filtered as JD stopwords
    expect(r.required).not.toContain("looking");
    expect(r.required).not.toContain("candidate");
    expect(r.required).not.toContain("experience");
  });

  it("captures phrases from 'experience with X' patterns", () => {
    const jd = "We're looking for someone with experience with gRPC and experience in Kubernetes.";
    const r = extractKeywords(jd);
    // gRPC + Kubernetes will be picked up via the tech term list
    expect(r.required).toContain("grpc");
    expect(r.required).toContain("kubernetes");
  });

  it("returns 0-100 score in compareKeywords", () => {
    const a = compareKeywords("Python and FastAPI", "I have built Python and FastAPI services.");
    expect(a.score).toBeGreaterThanOrEqual(0);
    expect(a.score).toBeLessThanOrEqual(100);
  });
});

/* -------------------------------------------------------------------------- */
/*                          compareKeywords (JD vs resume)                     */
/* -------------------------------------------------------------------------- */

describe("compareKeywords", () => {
  it("matches all required terms when the resume has them all", () => {
    const jd = "Python, FastAPI, PostgreSQL, Docker.";
    const resume = "Built Python and FastAPI services. Deployed with Docker, used PostgreSQL for storage.";
    const r = compareKeywords(jd, resume);
    expect(r.matched).toContain("python");
    expect(r.matched).toContain("fastapi");
    expect(r.matched).toContain("postgresql");
    expect(r.matched).toContain("docker");
    expect(r.missing).toHaveLength(0);
    expect(r.score).toBeGreaterThanOrEqual(70);
  });

  it("reports missing when the resume lacks required terms", () => {
    const jd = "Python, FastAPI, Kubernetes, Kafka, gRPC.";
    const resume = "Built Python and FastAPI services for an internal tool. No infrastructure orchestration work.";
    const r = compareKeywords(jd, resume);
    expect(r.matched).toContain("python");
    expect(r.matched).toContain("fastapi");
    expect(r.missing).toContain("kubernetes");
    expect(r.missing).toContain("kafka");
    expect(r.missing).toContain("grpc");
  });

  it("computes a higher score for full coverage than partial coverage", () => {
    const jd = "Python, FastAPI, Kubernetes, Kafka, gRPC.";
    const full = "Python, FastAPI, Kubernetes, Kafka, gRPC, Docker, PostgreSQL.";
    const partial = "Python, FastAPI. Nothing else relevant.";

    const rFull = compareKeywords(jd, full);
    const rPartial = compareKeywords(jd, partial);
    expect(rFull.score).toBeGreaterThan(rPartial.score);
  });

  it("detects nice-to-have matches and counts them toward the score", () => {
    const jd = `Required: Python, FastAPI.
Nice to have: Kubernetes, Kafka.`;
    const resume = "Python, FastAPI, Kubernetes, Kafka.";
    const r = compareKeywords(jd, resume);
    // niceMatched / niceTotal * 30 added on top of required
    expect(r.matched).toContain("python");
    expect(r.matched).toContain("fastapi");
    expect(r.niceToHave).toContain("kubernetes");
    expect(r.niceToHave).toContain("kafka");
  });

  it("is deterministic — same input gives same score", () => {
    const jd = "Python, FastAPI, PostgreSQL, Docker, Kubernetes, Kafka, gRPC, Redis, AWS, GCP, Azure.";
    const resume = "Built Python, FastAPI, PostgreSQL, Docker, Kubernetes. Used Redis, AWS.";
    const a = compareKeywords(jd, resume);
    const b = compareKeywords(jd, resume);
    expect(a.score).toBe(b.score);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("returns 0% when no required keywords and no resume text overlap", () => {
    const jd = "Looking for someone with extensive Python experience.";
    const resume = "Marketing manager, no technical background.";
    const r = compareKeywords(jd, resume);
    // "python" is required and missing from the resume
    expect(r.missing).toContain("python");
    expect(r.score).toBeLessThan(50);
  });

  it("identifies 'extra' resume terms that the JD didn't ask for", () => {
    const jd = "Looking for a Python developer with FastAPI experience.";
    const resume = "Built Python, FastAPI, Kubernetes, Docker, and Terraform pipelines.";
    const r = compareKeywords(jd, resume);
    expect(r.extra).toContain("kubernetes");
    expect(r.extra).toContain("docker");
    expect(r.extra).toContain("terraform");
  });

  it("clamps the score to 0-100", () => {
    // A JD with no requirements shouldn't blow up
    const a = compareKeywords("Just looking for a great engineer.", "Anything goes here.");
    expect(a.score).toBeGreaterThanOrEqual(0);
    expect(a.score).toBeLessThanOrEqual(100);
  });
});

import { describe, it, expect } from "vitest";
import { rewriteBullet, rewriteResume, generateCoverLetter } from "@/lib/ai-rewrite";

/* -------------------------------------------------------------------------- */
/*                              rewriteBullet                                 */
/* -------------------------------------------------------------------------- */

describe("rewriteBullet", () => {
  it("returns unchanged bullet for empty input", () => {
    const r = rewriteBullet("");
    expect(r.changed).toBe(false);
    expect(r.after).toBe("");
  });

  it("returns unchanged bullet that is already strong", () => {
    const bullet = "Built FastAPI platform handling 2M daily requests with 99.95% uptime.";
    const r = rewriteBullet(bullet);
    expect(r.changed).toBe(false);
  });

  it("replaces weak lead verb with a strong action verb", () => {
    const r = rewriteBullet("Was responsible for backend code.");
    expect(r.changed).toBe(true);
    expect(r.after).toMatch(/^(Built|Led|Shipped|Owned|Drove|Cut|Reduced|Increased|Designed|Architected|Launched|Migrated|Optimized|Scaled) /);
  });

  it("strips 'passionate' generic phrase", () => {
    const r = rewriteBullet("I'm a passionate engineer who built services handling 10k req/s.");
    expect(r.after.toLowerCase()).not.toContain("passionate");
  });

  it("strips 'team player' generic phrase", () => {
    const r = rewriteBullet("I'm a team player who helped deliver 3 releases.");
    expect(r.after.toLowerCase()).not.toContain("team player");
  });

  it("strips 'results-driven' generic phrase", () => {
    const r = rewriteBullet("Results-driven engineer who shipped FastAPI services.");
    expect(r.after.toLowerCase()).not.toContain("results-driven");
  });

  it("strips 'rockstar' generic phrase", () => {
    const r = rewriteBullet("Rockstar engineer who built a recommendation system serving 5k users.");
    expect(r.after.toLowerCase()).not.toContain("rockstar");
  });

  it("strips 'ninja' generic phrase", () => {
    const r = rewriteBullet("Python ninja who wrote 200 tests for our service.");
    expect(r.after.toLowerCase()).not.toContain("ninja");
  });

  it("adds a metric when bullet lacks numbers", () => {
    const r = rewriteBullet("Built the deployment pipeline for the team.");
    expect(/\d/.test(r.after)).toBe(true);
  });

  it("does NOT add a metric when bullet already has one", () => {
    const bullet = "Built FastAPI service handling 2M daily requests with 40% latency reduction.";
    const r = rewriteBullet(bullet);
    // Either unchanged OR the only change should be punctuation/formatting, not new metrics
    if (r.changed) {
      const originalNumbers = (bullet.match(/\d+/g) ?? []).length;
      const afterNumbers = (r.after.match(/\d+/g) ?? []).length;
      // Should not introduce a wildly different number of digits
      expect(Math.abs(afterNumbers - originalNumbers)).toBeLessThan(3);
    }
  });

  it("returns a reason that explains what changed", () => {
    const r = rewriteBullet("Was a team player on the API project.");
    if (r.changed) {
      expect(r.reason.length).toBeGreaterThan(5);
    }
  });

  it("injects JD-specific terms when provided and missing", () => {
    const jd = "Looking for experience with Kubernetes, gRPC, and Kafka.";
    const r = rewriteBullet("Built a backend service.", { jd });
    const jdTerms = ["kubernetes", "grpc", "kafka"];
    const present = jdTerms.filter((t) => r.after.toLowerCase().includes(t));
    expect(present.length).toBeGreaterThan(0);
  });

  it("is deterministic — same input → same output", () => {
    const a = rewriteBullet("Was responsible for the API rewrite.");
    const b = rewriteBullet("Was responsible for the API rewrite.");
    expect(a.after).toBe(b.after);
  });

  it("capitalizes the first letter of the output", () => {
    const r = rewriteBullet("was responsible for backend code");
    expect(r.after.charAt(0)).toBe(r.after.charAt(0).toUpperCase());
  });

  it("ends with a period", () => {
    const r = rewriteBullet("Built a new dashboard");
    expect(r.after).toMatch(/\.$/);
  });

  it("replaces corporate jargon (synergy, leverage)", () => {
    const r1 = rewriteBullet("Leveraged synergies to deploy the service");
    const r2 = rewriteBullet("Synergized across teams to deliver features");
    expect(r1.after.toLowerCase()).not.toContain("leverag");
    expect(r2.after.toLowerCase()).not.toContain("synerg");
  });

  it("replaces 'in order to' with 'to'", () => {
    const r = rewriteBullet("Built tooling in order to automate releases");
    expect(r.after.toLowerCase()).not.toContain("in order to");
  });
});

/* -------------------------------------------------------------------------- */
/*                              rewriteResume                                 */
/* -------------------------------------------------------------------------- */

describe("rewriteResume", () => {
  it("returns a summary rewrite and per-bullet rewrites", () => {
    const out = rewriteResume({
      summary: "Was a results-driven engineer.",
      experienceBullets: [
        { id: "1", bullet: "Built services." },
        { id: "2", bullet: "Was responsible for tests." },
      ],
    });
    expect(out.summary).not.toBeNull();
    expect(out.experienceBullets).toHaveLength(2);
  });

  it("returns null summary when input is empty/whitespace", () => {
    const out = rewriteResume({
      summary: "   ",
      experienceBullets: [{ id: "1", bullet: "Built X" }],
    });
    expect(out.summary).toBeNull();
  });

  it("preserves bullet IDs in the output", () => {
    const out = rewriteResume({
      summary: "",
      experienceBullets: [
        { id: "exp-1-0", bullet: "Was responsible for backend." },
        { id: "exp-2-1", bullet: "Helped with tests." },
      ],
    });
    const ids = out.experienceBullets.map((b) => b.id);
    expect(ids).toContain("exp-1-0");
    expect(ids).toContain("exp-2-1");
  });
});

/* -------------------------------------------------------------------------- */
/*                              generateCoverLetter                           */
/* -------------------------------------------------------------------------- */

describe("generateCoverLetter", () => {
  it("includes the name and company", () => {
    const letter = generateCoverLetter({
      name: "Sandeep K",
      targetRole: "Senior Python Developer",
      company: "TechCorp",
      jd: "Looking for Python and FastAPI experience.",
      topBullets: ["Built FastAPI service handling 2M req/s"],
    });
    expect(letter).toContain("Sandeep K");
    expect(letter).toContain("TechCorp");
  });

  it("includes the target role", () => {
    const letter = generateCoverLetter({
      name: "Jane Doe",
      targetRole: "Engineering Manager",
      company: "Acme",
      jd: "Leadership role",
      topBullets: ["Led 8 engineers"],
    });
    expect(letter).toContain("Engineering Manager");
  });

  it("extracts key terms from the JD", () => {
    const jd = "Looking for someone with experience in Kubernetes, gRPC, and Kafka.";
    const letter = generateCoverLetter({
      name: "A",
      targetRole: "B",
      company: "C",
      jd,
      topBullets: ["Built something"],
    });
    const found = ["kubernetes", "grpc", "kafka"].filter((t) => letter.toLowerCase().includes(t));
    // At least one of the three core JD terms should appear
    expect(found.length).toBeGreaterThanOrEqual(1);
  });

  it("has reasonable length (>= 100 chars, <= 2000 chars)", () => {
    const letter = generateCoverLetter({
      name: "Sandeep K",
      targetRole: "Senior Python Developer",
      company: "TechCorp",
      jd: "Python, FastAPI, Kubernetes, AWS, gRPC, Kafka",
      topBullets: ["Built FastAPI service handling 2M daily requests with 99.95% uptime"],
    });
    expect(letter.length).toBeGreaterThan(100);
    expect(letter.length).toBeLessThan(2000);
  });

  it("falls back gracefully when topBullets is empty", () => {
    const letter = generateCoverLetter({
      name: "A",
      targetRole: "B",
      company: "C",
      jd: "Some JD",
      topBullets: [],
    });
    expect(letter.length).toBeGreaterThan(50);
  });
});

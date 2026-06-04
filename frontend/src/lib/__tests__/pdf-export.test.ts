import { describe, it, expect } from "vitest";
import { getSafeFilename } from "@/components/builder/pdf-document";
import type { TemplateDef } from "@/lib/templates";

/* -------------------------------------------------------------------------- */
/*                            getSafeFilename                                  */
/* -------------------------------------------------------------------------- */

describe("getSafeFilename", () => {
  it("produces a clean filename from a full name", () => {
    expect(getSafeFilename("Sandeep K")).toBe("Sandeep-K.pdf");
  });

  it("handles names with multiple spaces and special chars", () => {
    expect(getSafeFilename("Sandeep  K!!  ")).toBe("Sandeep-K.pdf");
  });

  it("falls back to 'Resume' for empty input", () => {
    expect(getSafeFilename("")).toBe("Resume.pdf");
    expect(getSafeFilename("   ")).toBe("Resume.pdf");
  });

  it("falls back to 'Resume' when input is all punctuation", () => {
    expect(getSafeFilename("!@#$%")).toBe("Resume.pdf");
  });

  it("preserves numbers and ASCII alphanumerics", () => {
    expect(getSafeFilename("Jane Doe 2024")).toBe("Jane-Doe-2024.pdf");
  });

  it("strips leading and trailing hyphens", () => {
    expect(getSafeFilename("---Sandeep---")).toBe("Sandeep.pdf");
  });

  it("appends suffix when provided", () => {
    expect(getSafeFilename("Sandeep K", "Modern Minimal")).toBe("Sandeep-K-Modern-Minimal.pdf");
  });

  it("returns a valid PDF filename with .pdf extension", () => {
    const f = getSafeFilename("Sandeep K");
    expect(f).toMatch(/\.pdf$/);
  });

  it("does not include any path separators", () => {
    const f = getSafeFilename("../../../etc/passwd");
    expect(f).not.toContain("/");
    expect(f).not.toContain("..");
  });
});

/* -------------------------------------------------------------------------- */
/*                            PDF generation smoke test                        */
/* -------------------------------------------------------------------------- */

describe("ResumeDocument PDF generation (end-to-end)", () => {
  it("renders every template to a valid non-empty PDF blob", async () => {
    // @ts-ignore - @react-pdf/renderer is a runtime dep, types may not be in vitest env
    const { pdf } = await import("@react-pdf/renderer");
    // @ts-ignore
    const React = await import("react");
    const { ResumeDocument } = await import("@/components/builder/pdf-document");
    const { TEMPLATES } = await import("@/lib/templates");
    const { EMPTY_RESUME } = await import("@/lib/resume-store");

    for (const t of TEMPLATES) {
      const doc = React.createElement(ResumeDocument, {
        resume: EMPTY_RESUME,
        template: t,
        watermark: false,
      });
      // @ts-ignore
      const blob = await pdf(doc).toBlob();
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("application/pdf");
      expect(blob.size).toBeGreaterThan(2000); // every PDF should be at least 2 KB
    }
  });

  it("renders with watermark for free-tier users", async () => {
    const { pdf } = await import("@react-pdf/renderer");
    const React = await import("react");
    const { ResumeDocument } = await import("@/components/builder/pdf-document");
    const { TEMPLATES } = await import("@/lib/templates");
    const { EMPTY_RESUME } = await import("@/lib/resume-store");

    const t = TEMPLATES[0];
    const plain = await pdf(React.createElement(ResumeDocument, {
      resume: EMPTY_RESUME, template: t, watermark: false,
    })).toBlob();
    const wm = await pdf(React.createElement(ResumeDocument, {
      resume: EMPTY_RESUME, template: t, watermark: true,
    })).toBlob();
    // Watermark should add a non-trivial amount of bytes
    expect(wm.size).toBeGreaterThan(plain.size);
  });

  it("renders AI skills section when includeInResume is true", async () => {
    const { pdf } = await import("@react-pdf/renderer");
    const React = await import("react");
    const { ResumeDocument } = await import("@/components/builder/pdf-document");
    const { TEMPLATES } = await import("@/lib/templates");
    const { EMPTY_RESUME } = await import("@/lib/resume-store");

    const t = TEMPLATES[0];
    const noAI = await pdf(React.createElement(ResumeDocument, {
      resume: EMPTY_RESUME, template: t,
    })).toBlob();
    const withAI = await pdf(React.createElement(ResumeDocument, {
      resume: EMPTY_RESUME, template: t,
      aiSkills: {
        level: "advanced",
        bullets: [
          "Deep expertise in LLMs and RAG to ship AI features in production.",
          "Applied AI to debugging and test case generation in day-to-day engineering work.",
        ],
        includeInResume: true,
      },
    })).toBlob();
    // AI skills section adds bytes (section heading + bullets)
    expect(withAI.size).toBeGreaterThan(noAI.size);
  });
});

/* -------------------------------------------------------------------------- */
/*                          Template type sanity                               */
/* -------------------------------------------------------------------------- */

describe("TemplateDef type compatibility", () => {
  it("a real template definition from TEMPLATES has all the fields PDF needs", async () => {
    // Import TEMPLATES to verify the shape we depend on
    const { TEMPLATES } = await import("@/lib/templates");
    expect(TEMPLATES.length).toBeGreaterThan(0);
    for (const t of TEMPLATES) {
      // The PDF document requires these specific fields on every template
      const td: TemplateDef = t;
      expect(td.id).toBeTruthy();
      expect(td.name).toBeTruthy();
      expect(td.style).toBeDefined();
      expect(td.style.headerStyle).toMatch(/^(centered|left|banner|sidebar|split)$/);
      expect(td.style.accent).toMatch(/^(teal|navy|rose|amber|violet|mono)$/);
      expect(td.style.density).toMatch(/^(compact|comfortable|spacious)$/);
      expect(td.style.font).toMatch(/^(sans|serif|mono)$/);
    }
  });
});

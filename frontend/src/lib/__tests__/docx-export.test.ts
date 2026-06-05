import { describe, it, expect } from "vitest";
import { getSafeDocxFilename } from "@/components/builder/docx-document";

describe("getSafeDocxFilename", () => {
  it("handles empty name", () => {
    expect(getSafeDocxFilename("")).toBe("resume.docx");
  });

  it("slugifies a normal name", () => {
    expect(getSafeDocxFilename("John Doe")).toBe("john-doe.docx");
  });

  it("appends template suffix when provided", () => {
    expect(getSafeDocxFilename("Jane Smith", "Modern Teal")).toBe("jane-smith-modern-teal.docx");
  });

  it("strips special characters", () => {
    expect(getSafeDocxFilename("John (The) Doe!!!")).toBe("john-the-doe.docx");
  });

  it("trims and collapses whitespace", () => {
    expect(getSafeDocxFilename("  John   Doe  ")).toBe("john-doe.docx");
  });

  it("falls back when name is only special chars", () => {
    expect(getSafeDocxFilename("!!! @@@")).toBe("resume.docx");
  });

  it("slugifies template name with special characters", () => {
    expect(getSafeDocxFilename("Alice", "Classic & Co.")).toBe("alice-classic-co.docx");
  });
});

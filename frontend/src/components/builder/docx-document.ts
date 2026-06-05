"use client";

import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Header,
} from "docx";
import type { ResumeData } from "@/lib/resume-store";
import type { TemplateDef } from "@/lib/templates";

/* -------------------------------------------------------------------------- */
/*  Build the full .docx Document                                              */
/* -------------------------------------------------------------------------- */

export interface BuildDocxOptions {
  resume: ResumeData;
  template: TemplateDef;
  watermark: boolean;
}

/**
 * buildDocx — takes ResumeData and a TemplateDef, returns a docx Document
 * ready to be packed + downloaded.
 *
 * Uses the `docx` library API. Every section is optional — missing fields
 * are simply skipped so the document stays clean.
 */
export async function buildDocx(opts: BuildDocxOptions): Promise<Document> {
  const { resume, template, watermark } = opts;
  const accent = accentColor(template.style.accent);
  const font = fontName(template.style.font);

  const children: Paragraph[] = [];

  /* ---- watermark overlay (light text across the document) ---- */
  // The docx library doesn't have a first-class watermark API in v9,
  // so we approximate with a faint header paragraph.  A true diagonal
  // watermark requires a PNG image overlay — we keep it lightweight.
  if (watermark) {
    // Inserted as a section property comment; handled below in section props.
  }

  /* ---- Name ---- */
  if (resume.contact.name) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resume.contact.name,
            bold: true,
            size: 52, // 26pt
            font,
            color: accentuate(accent),
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
      }),
    );
  }

  /* ---- Title ---- */
  if (resume.contact.title) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resume.contact.title,
            size: 36, // 18pt
            font,
            color: "444444",
            italics: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      }),
    );
  }

  /* ---- Contact line ---- */
  const contactParts: string[] = [];
  if (resume.contact.email) contactParts.push(resume.contact.email);
  if (resume.contact.phone) contactParts.push(resume.contact.phone);
  if (resume.contact.location) contactParts.push(resume.contact.location);
  if (resume.contact.website) contactParts.push(resume.contact.website);
  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactParts.join("  ·  "),
            size: 22, // 11pt
            font,
            color: "666666",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    );
  }

  /* ---- Summary ---- */
  if (resume.summary) {
    children.push(sectionHeader("Professional Summary", font, accent));
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resume.summary,
            size: 22,
            font,
            color: "333333",
          }),
        ],
        spacing: { after: 200 },
      }),
    );
  }

  /* ---- Experience ---- */
  if (resume.experience && resume.experience.length > 0) {
    children.push(sectionHeader("Experience", font, accent));
    for (const exp of resume.experience) {
      // Company + location
      const headerParts: TextRun[] = [];
      if (exp.company) {
        headerParts.push(
          new TextRun({
            text: exp.company,
            bold: true,
            size: 24,
            font,
            color: "222222",
          }),
        );
      }
      if (exp.location) {
        headerParts.push(
          new TextRun({
            text: ` — ${exp.location}`,
            size: 22,
            font,
            color: "666666",
          }),
        );
      }

      const roleParts: TextRun[] = [];
      if (exp.role) {
        roleParts.push(
          new TextRun({
            text: exp.role,
            size: 22,
            font,
            color: "444444",
            italics: true,
          }),
        );
      }
      if (exp.start || exp.end) {
        roleParts.push(
          new TextRun({
            text: `  |  ${exp.start} — ${exp.end}`,
            size: 22,
            font,
            color: "888888",
          }),
        );
      }

      if (headerParts.length > 0) {
        children.push(new Paragraph({ children: headerParts, spacing: { before: 160, after: 0 } }));
      }
      if (roleParts.length > 0) {
        children.push(new Paragraph({ children: roleParts, spacing: { before: 40, after: 40 } }));
      }

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        for (const bullet of exp.bullets) {
          if (!bullet) continue;
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: "•  ", size: 22, font, color: accent }),
                new TextRun({ text: bullet, size: 22, font, color: "333333" }),
              ],
              spacing: { after: 40 },
              indent: { left: 400 },
            }),
          );
        }
      }
    }
  }

  /* ---- Skills ---- */
  if (resume.skills && resume.skills.length > 0) {
    children.push(sectionHeader("Skills", font, accent));
    const skillParts = resume.skills.filter(Boolean);
    if (skillParts.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: skillParts.join("  ·  "),
              size: 22,
              font,
              color: "333333",
            }),
          ],
          spacing: { after: 200 },
        }),
      );
    }
  }

  /* ---- Education ---- */
  if (resume.education && resume.education.length > 0) {
    children.push(sectionHeader("Education", font, accent));
    for (const edu of resume.education) {
      const schoolParts: TextRun[] = [];
      if (edu.school) {
        schoolParts.push(
          new TextRun({
            text: edu.school,
            bold: true,
            size: 24,
            font,
            color: "222222",
          }),
        );
      }
      if (schoolParts.length > 0) {
        children.push(new Paragraph({ children: schoolParts, spacing: { before: 120, after: 0 } }));
      }

      const detailParts: string[] = [];
      if (edu.degree) detailParts.push(edu.degree);
      if (edu.field) detailParts.push(edu.field);
      if (edu.start || edu.end) detailParts.push(`${edu.start} — ${edu.end}`);
      if (edu.gpa) detailParts.push(`GPA: ${edu.gpa}`);
      if (detailParts.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: detailParts.join("  |  "),
                size: 22,
                font,
                color: "555555",
              }),
            ],
            spacing: { after: 80 },
            indent: { left: 200 },
          }),
        );
      }
    }
  }

  /* ---- Projects ---- */
  if (resume.projects && resume.projects.length > 0) {
    children.push(sectionHeader("Projects", font, accent));
    for (const proj of resume.projects) {
      const projParts: TextRun[] = [];
      if (proj.name) {
        projParts.push(
          new TextRun({
            text: proj.name,
            bold: true,
            size: 24,
            font,
            color: "222222",
          }),
        );
      }
      if (proj.tech && proj.tech.length > 0) {
        projParts.push(
          new TextRun({
            text: `  |  ${proj.tech.join(", ")}`,
            size: 22,
            font,
            color: "666666",
          }),
        );
      }
      if (projParts.length > 0) {
        children.push(new Paragraph({ children: projParts, spacing: { before: 120, after: 40 } }));
      }

      if (proj.description) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: proj.description,
                size: 22,
                font,
                color: "333333",
              }),
            ],
            spacing: { after: 80 },
            indent: { left: 200 },
          }),
        );
      }
    }
  }

  /* ---- Certifications ---- */
  if (resume.certifications && resume.certifications.length > 0) {
    children.push(sectionHeader("Certifications", font, accent));
    for (const cert of resume.certifications) {
      const certParts: TextRun[] = [];
      if (cert.name) {
        certParts.push(
          new TextRun({
            text: cert.name,
            bold: true,
            size: 24,
            font,
            color: "222222",
          }),
        );
      }
      if (cert.issuer) {
        certParts.push(
          new TextRun({
            text: `  — ${cert.issuer}`,
            size: 22,
            font,
            color: "555555",
          }),
        );
      }
      if (cert.date) {
        certParts.push(
          new TextRun({
            text: `  (${cert.date})`,
            size: 22,
            font,
            color: "888888",
          }),
        );
      }
      if (certParts.length > 0) {
        children.push(new Paragraph({ children: certParts, spacing: { before: 80, after: 40 } }));
      }
    }
  }

  return new Document({
    styles: {
      default: {
        document: {
          run: { font, size: 22, color: "333333" },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: watermark ? 1440 : 1100, // 1.5in top for watermark room
              right: 1100,
              bottom: 1100,
              left: 1100,
            },
          },
        },
        headers: watermark
          ? {
              default: new Header({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: "WATERMARK — DRAFT",
                        size: 52,
                        font: "Arial",
                        color: "CCCCCC",
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
            }
          : undefined,
        children,
      },
    ],
  });
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function accentColor(accent: string): string {
  const map: Record<string, string> = {
    teal: "#0d9488",
    navy: "#0369a1",
    rose: "#e11d48",
    amber: "#d97706",
    violet: "#7c3aed",
    mono: "#475569",
  };
  return map[accent] || "#0d9488";
}

function fontName(font: string): string {
  const map: Record<string, string> = {
    sans: "Calibri",
    serif: "Times New Roman",
    mono: "Courier New",
  };
  return map[font] || "Calibri";
}

function sectionHeader(label: string, font: string, accent: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: label.toUpperCase(),
        bold: true,
        size: 22,
        font,
        color: accent,
      }),
    ],
    spacing: { before: 240, after: 80 },
    border: {
      bottom: {
        color: accent,
        size: 6,
        style: BorderStyle.SINGLE,
        space: 4,
      },
    },
  });
}

function accentuate(hex: string): string {
  // Ensure a readable dark accent for headings
  const dark = hex.length >= 7 ? hex : "#0d9488";
  return dark;
}

/** Sluggish-filename — exported so the test file can reach it. */
export function getSafeDocxFilename(name: string, templateName?: string): string {
  const slug = (name || "Resume")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    || "resume";
  const suffix = templateName
    ? `-${slugifyTemplate(templateName)}`
    : "";
  return `${slug}${suffix}.docx`;
}

function slugifyTemplate(t: string): string {
  return t
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}


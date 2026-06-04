"use client";

/**
 * React-PDF <Document /> component that renders a ResumeData + TemplateDef
 * to an A4 page. Mirrors the visual style of the on-screen preview in
 * builder-view.tsx but is fully self-contained for the PDF rendering layer
 * (uses built-in PDF fonts only: Helvetica, Times-Roman, Courier).
 *
 * Why no web fonts? Inter via @react-pdf/renderer Font.register would add
 * 200+ KB per weight to the bundle. Built-in fonts keep us under budget.
 * Visual parity is good enough — Helvetica ≈ Inter for body text.
 *
 * NOTE: This module is only ever imported via a dynamic import from
 * use-pdf-export.ts, so the ~500KB @react-pdf/renderer bundle is NOT in
 * the first-load JS. It loads on demand when the user clicks Download PDF.
 */

import * as React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ResumeData } from "@/lib/resume-store";
import type { TemplateDef } from "@/lib/templates";

/* -------------------------------------------------------------------------- */
/*                              Color + font maps                             */
/* -------------------------------------------------------------------------- */

const ACCENT_HEX: Record<string, { solid: string; dark: string; onSolid: string }> = {
  teal:   { solid: "#0d9488", dark: "#0f766e", onSolid: "#ffffff" },
  navy:   { solid: "#0369a1", dark: "#075985", onSolid: "#ffffff" },
  rose:   { solid: "#e11d48", dark: "#be123c", onSolid: "#ffffff" },
  amber:  { solid: "#d97706", dark: "#b45309", onSolid: "#ffffff" },
  violet: { solid: "#7c3aed", dark: "#6d28d9", onSolid: "#ffffff" },
  mono:   { solid: "#475569", dark: "#334155", onSolid: "#ffffff" },
};

const FONT_BY_KEY: Record<string, { regular: string; bold: string; italic: string; boldItalic: string }> = {
  sans:  { regular: "Helvetica",        bold: "Helvetica-Bold",        italic: "Helvetica-Oblique",        boldItalic: "Helvetica-BoldOblique" },
  serif: { regular: "Times-Roman",      bold: "Times-Bold",            italic: "Times-Italic",              boldItalic: "Times-BoldItalic"        },
  mono:  { regular: "Courier",          bold: "Courier-Bold",          italic: "Courier-Oblique",           boldItalic: "Courier-BoldOblique"     },
};

const A4_HEIGHT = 842;   // pts
const A4_WIDTH  = 595;   // pts
const MARGIN    = 48;    // pts — 0.667 inch
const BODY_SIZE = 9.5;
const H1_SIZE   = 18;
const H2_SIZE   = 10;
const SMALL     = 7.5;

const FONT_BODY: Record<string, number> = { compact: 8.5, comfortable: 9.5, spacious: 10.5 };
const LINE_GAP: Record<string, number>  = { compact: 1.2, comfortable: 1.35, spacious: 1.5 };

/* -------------------------------------------------------------------------- */
/*                            Filename helper (testable)                       */
/* -------------------------------------------------------------------------- */

export function getSafeFilename(name: string, suffix = ""): string {
  const slug = (s: string) =>
    (s || "").trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "Resume";
  const base = slug(name);
  return suffix ? `${base}-${slug(suffix)}.pdf` : `${base}.pdf`;
}

/* -------------------------------------------------------------------------- */
/*                                  Styles                                    */
/* -------------------------------------------------------------------------- */

function makeStyles(template: TemplateDef) {
  const accent = ACCENT_HEX[template.style.accent] ?? ACCENT_HEX.teal;
  const font   = FONT_BY_KEY[template.style.font]   ?? FONT_BY_KEY.sans;
  const bodySize = FONT_BODY[template.style.density] ?? BODY_SIZE;
  const lineGap  = LINE_GAP[template.style.density]  ?? 1.35;

  return StyleSheet.create({
    page: {
      paddingTop:    MARGIN,
      paddingBottom: MARGIN,
      paddingLeft:   MARGIN,
      paddingRight:  MARGIN,
      fontFamily:    font.regular,
      fontSize:      bodySize,
      lineHeight:    lineGap,
      color:         "#1f2937",
    },

    /* ----------------- Header variants ----------------- */

    headerCentered: { alignItems: "center", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", borderBottomStyle: "solid", marginBottom: 12 },
    headerLeft:     { paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", borderBottomStyle: "solid", marginBottom: 12 },
    headerBanner:   { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: accent.solid, color: accent.onSolid, marginBottom: 12, borderRadius: 4 },
    headerSidebar:  { flexDirection: "row", marginBottom: 12 },
    headerSplit:    { flexDirection: "row", alignItems: "center", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", borderBottomStyle: "solid", marginBottom: 12, gap: 12 },
    avatar:         { width: 44, height: 44, borderRadius: 22, backgroundColor: "#e2e8f0" },

    sidebarLeft:  { width: "32%", backgroundColor: accent.solid, color: accent.onSolid, padding: 12, marginRight: 14, borderRadius: 4 },
    sidebarRight: { flex: 1 },

    h1: { fontSize: H1_SIZE, fontFamily: font.bold, letterSpacing: 0.2 },
    h1Banner: { fontSize: H1_SIZE, fontFamily: font.bold, color: accent.onSolid },
    h1Sidebar: { fontSize: 14, fontFamily: font.bold, color: accent.onSolid, marginBottom: 2 },

    title: { fontSize: 9.5, color: "#475569", marginTop: 2 },
    titleBanner: { fontSize: 9.5, color: accent.onSolid, marginTop: 2, opacity: 0.85 },
    titleSidebar: { fontSize: 8.5, color: accent.onSolid, opacity: 0.9, marginBottom: 8 },
    contact: { fontSize: 8.5, color: "#64748b", marginTop: 4 },
    contactBanner: { fontSize: 8.5, color: accent.onSolid, marginTop: 4, opacity: 0.85 },
    contactSidebar: { fontSize: 7.5, color: accent.onSolid, opacity: 0.85, marginBottom: 1.5 },

    /* ----------------- Section heading ----------------- */

    section:    { marginTop: 12 },
    sectionH:   { fontSize: H2_SIZE, fontFamily: font.bold, color: accent.dark, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, borderBottomWidth: 0.5, borderBottomColor: accent.solid, borderBottomStyle: "solid", paddingBottom: 2 },
    sectionHSidebar: { fontSize: 9, fontFamily: font.bold, color: accent.onSolid, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, marginTop: 8 },

    /* ----------------- Experience ----------------- */

    expBlock: { marginBottom: 8 },
    expRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
    expRole:  { fontFamily: font.bold, fontSize: bodySize + 0.5 },
    expDates: { fontFamily: font.regular, fontSize: 8.5, color: "#64748b" },
    expCompany: { fontFamily: font.regular, fontSize: bodySize, color: "#475569" },
    bullet:    { flexDirection: "row", marginTop: 1.5, paddingLeft: 4 },
    bulletDot: { width: 6, fontFamily: font.bold, color: "#94a3b8" },
    bulletText:{ flex: 1, fontSize: bodySize, color: "#1f2937" },

    /* ----------------- Skills + Education grid ----------------- */

    gridRow: { flexDirection: "row", gap: 16, marginTop: 4 },
    gridCol: { flex: 1 },
    skillsText: { fontSize: bodySize, color: "#1f2937" },
    eduText: { fontSize: bodySize - 0.5, color: "#1f2937" },
    eduSchool: { fontFamily: font.bold },

    /* ----------------- Watermark ----------------- */

    watermarkContainer: {
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      zIndex: -1,
    },
    watermarkText: {
      fontSize: 96,
      fontFamily: font.bold,
      color: "#000000",
      opacity: 0.06,
      transform: "rotate(-30deg)",
      letterSpacing: 4,
    },

    /* ----------------- AI Skills ----------------- */

    aiSkillRow: { flexDirection: "row", marginTop: 1.5, paddingLeft: 4 },
    aiSkillDot: { width: 6, color: accent.solid, fontFamily: font.bold },
  });
}

/* -------------------------------------------------------------------------- */
/*                              <ResumeDocument />                            */
/* -------------------------------------------------------------------------- */

export interface ResumeDocumentProps {
  resume: ResumeData;
  template: TemplateDef;
  /** When true, adds a "Created with CareerAI" watermark behind the content. */
  watermark?: boolean;
  /** Per-version AI skills (optional). When set + aiSkills.includeInResume, rendered in the skills section. */
  aiSkills?: {
    level: string;
    bullets: string[];
    includeInResume: boolean;
  };
}

export const ResumeDocument: React.FC<ResumeDocumentProps> = ({ resume, template, watermark = false, aiSkills }) => {
  const s = makeStyles(template);

  // Compose a single skills string for the freeform Skills section,
  // optionally appending AI skill bullets when the user opted in.
  const allSkills = React.useMemo(() => {
    if (!aiSkills?.includeInResume || !aiSkills.bullets?.length) return resume.skills;
    return resume.skills; // AI bullets go in their own section below
  }, [resume.skills, aiSkills]);

  return (
    <Document
      title={`${resume.contact.name || "Resume"} — ${template.name}`}
      author={resume.contact.name || ""}
      subject="Resume"
      keywords="resume, career"
    >
      <Page size="A4" style={s.page}>
        {/* Watermark sits behind everything */}
        {watermark && (
          <View style={s.watermarkContainer} fixed>
            <Text style={s.watermarkText}>CareerAI</Text>
          </View>
        )}

        <Header resume={resume} template={template} styles={s} />
        <Summary  resume={resume} template={template} styles={s} />
        <Experience resume={resume} styles={s} />
        <SkillsAndEducation resume={resume} styles={s} allSkills={allSkills} />
        {aiSkills?.includeInResume && aiSkills.bullets?.length > 0 && (
          <AiSkillsSection bullets={aiSkills.bullets} styles={s} />
        )}
        {resume.projects.length > 0 && <Projects resume={resume} styles={s} />}
        {resume.certifications.length > 0 && <Certifications resume={resume} styles={s} />}
      </Page>
    </Document>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Subcomponents                                 */
/* -------------------------------------------------------------------------- */

const Header: React.FC<{ resume: ResumeData; template: TemplateDef; styles: any }> = ({ resume, template, styles: s }) => {
  const c = resume.contact;
  const contactLine = [c.email, c.phone, c.location].filter(Boolean).join(" · ");

  if (template.style.headerStyle === "centered") {
    return (
      <View style={s.headerCentered}>
        <Text style={s.h1}>{c.name || "Your Name"}</Text>
        {!!c.title && <Text style={s.title}>{c.title}</Text>}
        {!!contactLine && <Text style={s.contact}>{contactLine}</Text>}
      </View>
    );
  }

  if (template.style.headerStyle === "left") {
    return (
      <View style={s.headerLeft}>
        <Text style={s.h1}>{c.name || "Your Name"}</Text>
        {!!c.title && <Text style={s.title}>{c.title}</Text>}
        {!!contactLine && <Text style={s.contact}>{contactLine}</Text>}
      </View>
    );
  }

  if (template.style.headerStyle === "banner") {
    return (
      <View style={s.headerBanner}>
        <Text style={s.h1Banner}>{c.name || "Your Name"}</Text>
        {!!c.title && <Text style={s.titleBanner}>{c.title}</Text>}
        {!!contactLine && <Text style={s.contactBanner}>{contactLine}</Text>}
      </View>
    );
  }

  if (template.style.headerStyle === "sidebar") {
    return (
      <View style={s.headerSidebar}>
        <View style={s.sidebarLeft}>
          <Text style={s.h1Sidebar}>{c.name || "Your Name"}</Text>
          {!!c.title && <Text style={s.titleSidebar}>{c.title}</Text>}
          {!!c.email   && <Text style={s.contactSidebar}>{c.email}</Text>}
          {!!c.phone   && <Text style={s.contactSidebar}>{c.phone}</Text>}
          {!!c.location&& <Text style={s.contactSidebar}>{c.location}</Text>}
          {!!c.website && <Text style={s.contactSidebar}>{c.website}</Text>}
          {!!c.linkedin&& <Text style={s.contactSidebar}>{c.linkedin}</Text>}
          {!!c.github  && <Text style={s.contactSidebar}>{c.github}</Text>}
        </View>
        <View style={s.sidebarRight}>
          {/* Summary lives in the sidebar header for this template style */}
          {!!resume.summary && (
            <View>
              <Text style={s.sectionHSidebar}>Summary</Text>
              <Text style={{ fontSize: 9, color: "#1f2937" }}>{resume.summary}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // split
  return (
    <View style={s.headerSplit}>
      <View style={s.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={s.h1}>{c.name || "Your Name"}</Text>
        {!!c.title && <Text style={s.title}>{c.title}</Text>}
        {!!contactLine && <Text style={s.contact}>{contactLine}</Text>}
      </View>
    </View>
  );
};

const Summary: React.FC<{ resume: ResumeData; template: TemplateDef; styles: any }> = ({ resume, template, styles: s }) => {
  if (template.style.headerStyle === "sidebar") return null; // already in header
  if (!resume.summary?.trim()) return null;
  return (
    <View style={s.section}>
      <Text style={s.sectionH}>Summary</Text>
      <Text style={{ fontSize: s.page.fontSize, color: "#1f2937" }}>{resume.summary}</Text>
    </View>
  );
};

const Experience: React.FC<{ resume: ResumeData; styles: any }> = ({ resume, styles: s }) => {
  if (resume.experience.length === 0) return null;
  return (
    <View style={s.section}>
      <Text style={s.sectionH}>Experience</Text>
      {resume.experience.map((exp) => (
        <View key={exp.id} style={s.expBlock} wrap={false}>
          <View style={s.expRow}>
            <Text style={s.expRole}>
              {exp.role || "Role"}
              {exp.company ? <Text style={s.expCompany}>{`  ·  ${exp.company}`}</Text> : null}
            </Text>
            <Text style={s.expDates}>
              {exp.start || "—"} — {exp.end || "Present"}
            </Text>
          </View>
          {exp.bullets.filter(Boolean).map((b, i) => (
            <View key={i} style={s.bullet}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const SkillsAndEducation: React.FC<{ resume: ResumeData; styles: any; allSkills: string[] }> = ({ resume, styles: s, allSkills }) => {
  const hasSkills = allSkills.length > 0;
  const hasEdu    = resume.education.length > 0;
  if (!hasSkills && !hasEdu) return null;
  return (
    <View style={s.gridRow}>
      {hasSkills && (
        <View style={s.gridCol}>
          <Text style={s.sectionH}>Skills</Text>
          <Text style={s.skillsText}>{allSkills.join("  ·  ")}</Text>
        </View>
      )}
      {hasEdu && (
        <View style={s.gridCol}>
          <Text style={s.sectionH}>Education</Text>
          {resume.education.map((e) => (
            <Text key={e.id} style={s.eduText}>
              <Text style={s.eduSchool}>{`${e.degree || ""} ${e.field || ""}`.trim() || "Degree"}</Text>
              {`  ·  ${e.school || "School"}${e.start || e.end ? `  ·  ${e.start || ""}–${e.end || ""}` : ""}`}
              {e.honors ? `\n${e.honors}` : ""}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const Projects: React.FC<{ resume: ResumeData; styles: any }> = ({ resume, styles: s }) => (
  <View style={s.section}>
    <Text style={s.sectionH}>Projects</Text>
    {resume.projects.map((p) => (
      <View key={p.id} style={s.expBlock} wrap={false}>
        <View style={s.expRow}>
          <Text style={s.expRole}>{p.name || "Project"}</Text>
          {p.link ? <Text style={s.expDates}>{p.link}</Text> : null}
        </View>
        {!!p.description && <Text style={{ fontSize: s.page.fontSize, color: "#475569", marginTop: 1 }}>{p.description}</Text>}
        {p.bullets.filter(Boolean).map((b, i) => (
          <View key={i} style={s.bullet}>
            <Text style={s.bulletDot}>•</Text>
            <Text style={s.bulletText}>{b}</Text>
          </View>
        ))}
        {p.tech.length > 0 && <Text style={{ fontSize: 7.5, color: "#64748b", marginTop: 2 }}>Tech: {p.tech.join(", ")}</Text>}
      </View>
    ))}
  </View>
);

const Certifications: React.FC<{ resume: ResumeData; styles: any }> = ({ resume, styles: s }) => (
  <View style={s.section}>
    <Text style={s.sectionH}>Certifications</Text>
    {resume.certifications.map((c) => (
      <Text key={c.id} style={s.eduText}>
        <Text style={s.eduSchool}>{c.name}</Text>
        {`  ·  ${c.issuer}${c.date ? `  ·  ${c.date}` : ""}`}
      </Text>
    ))}
  </View>
);

const AiSkillsSection: React.FC<{ bullets: string[]; styles: any }> = ({ bullets, styles: s }) => (
  <View style={s.section}>
    <Text style={s.sectionH}>AI Skills</Text>
    {bullets.filter(Boolean).map((b, i) => (
      <View key={i} style={s.aiSkillRow}>
        <Text style={s.aiSkillDot}>•</Text>
        <Text style={s.bulletText}>{b}</Text>
      </View>
    ))}
  </View>
);

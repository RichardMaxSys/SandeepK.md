"use client";

/**
 * usePdfExport — the bridge between the Builder view's "Download PDF" button
 * and the @react-pdf/renderer library.
 *
 * Why a dynamic import? @react-pdf/renderer + its dependency tree is ~500 KB
 * minified. The user only needs it when they click "Download PDF" — so we
 * lazy-load it on demand. The first-load JS bundle stays small.
 *
 * Usage in a view component:
 *
 *   const { generate, isGenerating, error, lastFilename } = usePdfExport();
 *   ...
 *   <Button onClick={() => generate({ resume, template, watermark: !isPro })}>
 *     PDF
 *   </Button>
 *
 * The hook tracks loading state, the last generated filename (so we can show
 * a toast), and surfaces any errors from the PDF renderer.
 */

import * as React from "react";
import type { ResumeData } from "@/lib/resume-store";
import type { TemplateDef } from "@/lib/templates";
import type { ResumeDocumentProps } from "./pdf-document";

/** Cached module reference so we only dynamic-import once per page load. */
let _pdfRendererCache: Promise<typeof import("@react-pdf/renderer")> | null = null;
async function loadRenderer() {
  if (!_pdfRendererCache) {
    _pdfRendererCache = import("@react-pdf/renderer");
  }
  return _pdfRendererCache;
}

export interface UsePdfExportOptions {
  /** Optional callback fired after a successful download. */
  onSuccess?: (filename: string) => void;
  /** Optional callback fired on any error. */
  onError?: (err: unknown) => void;
}

export interface UsePdfExportReturn {
  /** Trigger a PDF generation. Resolves with the filename used. */
  generate: (opts: { resume: ResumeData; template: TemplateDef; watermark: boolean; aiSkills?: ResumeDocumentProps["aiSkills"] }) => Promise<string>;
  /** True while @react-pdf/renderer is being loaded + the PDF is being rendered. */
  isGenerating: boolean;
  /** Last error, if any. Cleared on next successful generate(). */
  error: Error | null;
  /** The filename of the most recently generated PDF (or null). */
  lastFilename: string | null;
}

export function usePdfExport(options: UsePdfExportOptions = {}): UsePdfExportReturn {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [lastFilename, setLastFilename] = React.useState<string | null>(null);

  const generate = React.useCallback(
    async (opts: { resume: ResumeData; template: TemplateDef; watermark: boolean; aiSkills?: ResumeDocumentProps["aiSkills"] }) => {
      setIsGenerating(true);
      setError(null);
      try {
        const renderer = await loadRenderer();
        // CJS/ESM interop: named exports may be on .default
        const m = (renderer as any).default || renderer;
        const pdf = m.pdf;
        const ResumeDocument = m.ResumeDocument;
        if (!ResumeDocument) {
          throw new Error("PDF document component failed to load. Refresh the page and try again.");
        }
        const doc = React.createElement(ResumeDocument, {
          resume: opts.resume,
          template: opts.template,
          watermark: opts.watermark,
          aiSkills: opts.aiSkills,
        });
        const blob = await pdf(doc as any).toBlob();
        const filename = `${slugify(opts.resume.contact.name || "Resume")}-${slugify(opts.template.name)}.pdf`;
        triggerDownload(blob, filename);
        setLastFilename(filename);
        options.onSuccess?.(filename);
        return filename;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        options.onError?.(err);
        // Log only the kind + length, never the resume text (PII safety)
        // eslint-disable-next-line no-console
        console.error("[pdf-export] generation failed:", e.message);
        throw e;
      } finally {
        setIsGenerating(false);
      }
    },
    [options],
  );

  return { generate, isGenerating, error, lastFilename };
}

/* -------------------------------------------------------------------------- */
/*                              Helpers                                       */
/* -------------------------------------------------------------------------- */

function slugify(s: string): string {
  return (s || "")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "resume";
}

function triggerDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Defer cleanup so Safari can complete the download
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

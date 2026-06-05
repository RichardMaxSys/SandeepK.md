"use client";
import * as React from "react";

type ResumeDocumentProps = {
  resume: any;
  template: any;
  watermark: boolean;
};

export function usePdfExport(
  opts: { onSuccess?: (fn: string) => void; onError?: (e: unknown) => void } = {},
) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const generate = async (input: { resume: any; template: any; watermark: boolean; aiSkills?: any }) => {
    setIsGenerating(true);
    setError(null);
    try {
      // 1. Load @react-pdf/renderer
      const rendererMod = await import("@react-pdf/renderer");
      const renderer: any = (rendererMod as any).default || rendererMod;
      const pdfFn = renderer.pdf;
      if (!pdfFn) throw new Error("@react-pdf/renderer did not export pdf()");

      // 2. Load the local document component
      const docMod = await import("./pdf-document");
      const docAny: any = (docMod as any).default || docMod;

      // The component could be ResumeDocument, PdfDocument, or default export
      const ResumeDocument = docAny.ResumeDocument || docAny.PdfDocument || docAny.default || docAny;
      if (!ResumeDocument || typeof ResumeDocument !== "function") {
        throw new Error("pdf-document.tsx did not export a valid React component");
      }

      // 3. Create the document element
      const element = React.createElement(ResumeDocument, {
        resume: input.resume,
        template: input.template,
        watermark: input.watermark,
        aiSkills: input.aiSkills,
      } as ResumeDocumentProps);

      // 4. Generate PDF blob
      const instance = pdfFn(element);
      const blob = await instance.toBlob();

      // 5. Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const slug = (s: string) =>
        (s || "").trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "resume";
      const templateSlug = slug(input.template?.name || "resume");
      const nameSlug = slug(input.resume?.contact?.name || "resume");
      a.download = `${nameSlug}-${templateSlug}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      opts.onSuccess?.(a.download);
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error("[pdf-export] generation failed:", msg);
      setError(msg);
      opts.onError?.(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return { generate, isGenerating, error };
}

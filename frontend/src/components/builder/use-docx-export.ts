"use client";

/**
 * useDocxExport — the bridge between the Builder view's "Download DOCX" button
 * and the `docx` / `file-saver` libraries.
 *
 * Follows the same lazy-import pattern as usePdfExport:
 *  - `docx` (Packer + Document) is dynamically imported on first call.
 *  - `file-saver` is also lazy-loaded.
 */

import * as React from "react";
import type { BuildDocxOptions } from "./docx-document";

/* -------------------------------------------------------------------------- */
/*  Dynamic-import caches                                                     */
/* -------------------------------------------------------------------------- */

let _docxModule: Promise<any> | null = null;
async function loadDocx() {
  if (!_docxModule) _docxModule = import("docx");
  return _docxModule;
}

let _fileSaverModule: Promise<any> | null = null;
async function loadFileSaver() {
  if (!_fileSaverModule) _fileSaverModule = import("file-saver");
  return _fileSaverModule;
}

let _docxDocumentModule: Promise<any> | null = null;
async function loadDocxDocument() {
  if (!_docxDocumentModule) _docxDocumentModule = import("./docx-document");
  return _docxDocumentModule;
}

/* -------------------------------------------------------------------------- */
/*  Hook                                                                      */
/* -------------------------------------------------------------------------- */

export interface UseDocxExportOptions {
  onSuccess?: (filename: string) => void;
  onError?: (err: unknown) => void;
}

export interface UseDocxExportReturn {
  /** Trigger a DOCX generation. Resolves with the filename used. */
  generate: (opts: BuildDocxOptions) => Promise<string>;
  /** True while libraries are being loaded and the document is being built. */
  isGenerating: boolean;
  /** Last error, if any. Cleared on next successful generate(). */
  error: Error | null;
  /** The filename of the most recently generated DOCX (or null). */
  lastFilename: string | null;
}

export function useDocxExport(options: UseDocxExportOptions = {}): UseDocxExportReturn {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [lastFilename, setLastFilename] = React.useState<string | null>(null);

  const generate = React.useCallback(
    async (opts: BuildDocxOptions) => {
      setIsGenerating(true);
      setError(null);
      try {
        const [docxModule, fsModule, docModule] = await Promise.all([
          loadDocx(),
          loadFileSaver(),
          loadDocxDocument(),
        ]);

        const { Packer } = docxModule;
        const saveAs = fsModule.saveAs || fsModule.default?.saveAs;
        const { buildDocx, getSafeDocxFilename } = docModule;

        const document = await buildDocx(opts);
        const blob = await Packer.toBlob(document);
        const filename = getSafeDocxFilename(
          opts.resume.contact.name || "Resume",
          opts.template.name,
        );

        saveAs(blob, filename);
        setLastFilename(filename);
        options.onSuccess?.(filename);
        return filename;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        options.onError?.(err);
        // eslint-disable-next-line no-console
        console.error("[docx-export] generation failed:", e.message);
        throw e;
      } finally {
        setIsGenerating(false);
      }
    },
    [options],
  );

  return { generate, isGenerating, error, lastFilename };
}

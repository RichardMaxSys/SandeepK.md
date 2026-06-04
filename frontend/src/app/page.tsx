"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopNav, TabContextBar, type TabKey } from "@/components/shell/top-nav";
import { BuilderView } from "@/components/views/builder-view";
import { CheckView } from "@/components/views/check-view";
import { TailorView } from "@/components/views/tailor-view";
import { ResumeProvider } from "@/lib/resume-store";

export default function Page() {
  const [tab, setTab] = React.useState<TabKey>("builder");

  return (
    <ResumeProvider>
      <div className="min-h-screen flex flex-col bg-canvas text-ink">
        <TopNav active={tab} onChange={setTab} />

        <main className="flex-1">
          <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
            <AnimatePresence mode="wait">
              {tab === "builder" && (
                <motion.div
                  key="builder"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  <BuilderView />
                </motion.div>
              )}

              {tab === "check" && (
                <motion.div
                  key="check"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  <CheckView />
                </motion.div>
              )}

              {tab === "tailor" && (
                <motion.div
                  key="tailor"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  <TailorView />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </ResumeProvider>
  );
}

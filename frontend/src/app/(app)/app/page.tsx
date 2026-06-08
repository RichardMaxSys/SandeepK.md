"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AppTopNav, TabContextBar, type TabKey } from "@/components/shell/top-nav";
import { BuilderView } from "@/components/views/builder-view";
import { CheckView } from "@/components/views/check-view";
import { TailorView } from "@/components/views/tailor-view";
import { ResumeProvider } from "@/lib/resume-store";
import { AuthModal } from "@/components/auth/auth-modal";

export default function AppPage() {
  const [tab, setTab] = React.useState<TabKey>("builder");
  const [authOpen, setAuthOpen] = React.useState(false);
  const [authDefaultTab, setAuthDefaultTab] = React.useState<"login" | "signup">("login");

  // Listen for cross-tab navigation and auth events
  React.useEffect(() => {
    const onNav = (e: Event) => {
      const detail = (e as CustomEvent).detail as { tab?: TabKey };
      if (detail?.tab) setTab(detail.tab);
    };
    const onOpenAuth = () => {
      setAuthDefaultTab("login");
      setAuthOpen(true);
    };
    const onOpenCheckout = (e: Event) => {
      const detail = (e as CustomEvent).detail as { plan?: string };
      // Trigger upgrade flow — open checkout in new window
      // The user menu handles the actual API call; this is a fallback
      setAuthDefaultTab("login");
      setAuthOpen(true);
    };

    window.addEventListener("resumeelevate:navigate", onNav);
    window.addEventListener("resumeelevate:open-auth", onOpenAuth);
    window.addEventListener("resumeelevate:open-checkout", onOpenCheckout);
    return () => {
      window.removeEventListener("resumeelevate:navigate", onNav);
      window.removeEventListener("resumeelevate:open-auth", onOpenAuth);
      window.removeEventListener("resumeelevate:open-checkout", onOpenCheckout);
    };
  }, []);

  return (
    <ResumeProvider>
      <div className="min-h-screen flex flex-col bg-canvas text-ink">
        <AppTopNav active={tab} onChange={setTab} onOpenAuth={() => setAuthOpen(true)} />

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

        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          defaultTab={authDefaultTab}
        />
      </div>
    </ResumeProvider>
  );
}

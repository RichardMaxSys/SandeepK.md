import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "@/components/client-layout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: 'ResumeElevate — AI Resume Builder & ATS Optimizer',
  description: 'Build a resume that gets past ATS and gets more interviews. Create, check, and tailor every resume with AI — then export polished PDF or DOCX files in minutes.',
  openGraph: {
    title: 'ResumeElevate — AI Resume Builder & ATS Optimizer',
    description: 'Build a resume that gets past ATS and gets more interviews.',
    siteName: 'ResumeElevate',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="bg-canvas text-ink antialiased min-h-screen">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerAI — AI-Powered Career Intelligence Platform",
  description: "Supercharge your job search with AI-powered ATS optimization, smart job matching, and recruiter-grade resume tailoring.",
  keywords: ["career", "jobs", "AI", "resume", "ATS", "job search"],
  openGraph: {
    title: "CareerAI — AI-Powered Career Intelligence Platform",
    description: "Supercharge your job search with AI-powered ATS optimization and smart job matching.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-charcoal text-gray-100 font-sans">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FeedbackKit — Feature Request Boards for Indie SaaS",
  description:
    "Feature request boards + roadmap voting for indie SaaS founders. Canny, but at $9/mo.",
  openGraph: {
    title: "FeedbackKit",
    description: "Feature request boards + roadmap voting for indie SaaS",
    url: "https://feedbackkit.threestack.io",
    siteName: "FeedbackKit",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

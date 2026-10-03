import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

// Both fonts ship with the app: no request to a font host at build or run time.
const instrumentSerif = localFont({
  src: "../fonts/InstrumentSerif-Regular.woff2",
  variable: "--font-instrument-serif",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "FlowMind", template: "%s · FlowMind" },
  description:
    "Drop in notes, tasks and ideas. FlowMind files them into projects, plans your day and tells you what can wait.",
  keywords: ["productivity", "second brain", "task management", "notes", "daily plan"],
  authors: [{ name: "Elisabeth Nnamani" }],
  openGraph: {
    title: "FlowMind",
    description: "Put it down. FlowMind files it, plans your day and tells you what can wait.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowMind",
    description: "Put it down. FlowMind files it, plans your day and tells you what can wait.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F2F0EC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${instrumentSerif.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "FlowMind - Your AI-Powered Second Brain",
  description:
    "An AI productivity OS for busy people. Dump notes, tasks, and ideas — let AI organize them into actionable plans. Powered by Groq + Mistral.",
  keywords: ["productivity", "AI", "second brain", "task management", "Groq", "Mistral", "notes", "organization"],
  authors: [{ name: "FlowMind" }],
  openGraph: {
    title: "FlowMind - Your AI-Powered Second Brain",
    description: "An AI productivity OS for busy people. Let AI organize your chaos into clarity.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowMind - Your AI-Powered Second Brain",
    description: "An AI productivity OS for busy people.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c87eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

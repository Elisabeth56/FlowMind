"use client";

import * as motion from "motion/react-client";
import { revealViewport } from "@/lib/motion";
import Link from "next/link";
import { Brain, Github, Mail } from "lucide-react";

// Only destinations that actually exist — the previous list linked a dozen
// pages (Blog, Changelog, Careers, API...) that were never built.
const footerLinks: Record<string, { name: string; href: string }[]> = {
  Product: [
    { name: "Features", href: "/#features" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Pricing", href: "/pricing" },
  ],
  Account: [
    { name: "Sign up", href: "/signup" },
    { name: "Log in", href: "/login" },
    { name: "Dashboard", href: "/dash" },
  ],
};

const socialLinks = [
  { icon: Github, href: "https://github.com/Elisabeth56/FlowMind", label: "GitHub" },
  { icon: Mail, href: "mailto:hello@flowmind.app", label: "Email" },
];

export default function Footer() {
  return (
    <footer className="relative bg-slate-900 pt-20 pb-10 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(ellipse 50% 50% at 20% 20%, rgba(56, 189, 248, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse 50% 50% at 80% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)
            `,
          }}
        />
      </div>

      {/* Large FlowMind text watermark */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={revealViewport}
        transition={{ duration: 0.6 }}
      >
        <span className="text-[10rem] md:text-[16rem] font-bold text-white/[0.03] tracking-tighter leading-none select-none whitespace-nowrap">
          flowmind
        </span>
      </motion.div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 mb-16">
          {/* Left Column - Brand */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={revealViewport}
            transition={{ duration: 0.5 }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
              <Brain className="w-8 h-8 text-azure-400" />
              <span>flow<span className="text-azure-400">mind</span></span>
            </div>

            <p className="text-slate-400 max-w-sm mb-8 leading-relaxed">
              Your AI-powered second brain. Dump your thoughts, let AI organize them,
              and finally achieve the clarity you deserve.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={social.href.startsWith("http") ? "noreferrer" : undefined}
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-azure-500 hover:text-white transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Links */}
          <motion.div
            className="grid grid-cols-2 gap-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={revealViewport}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-white font-medium mb-4">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-slate-400 text-sm hover:text-azure-400 transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Closing CTA */}
        <motion.div
          className="bg-slate-800/50 rounded-2xl p-8 mb-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={revealViewport}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Get back in the flow
              </h4>
              <p className="text-slate-400 text-sm">
                Free to start. Fifty AI calls a month, no card required.
              </p>
            </div>
            <Link
              href="/signup"
              className="px-6 py-3 bg-azure-500 text-white font-medium rounded-full hover:bg-azure-600 transition-colors whitespace-nowrap"
            >
              Create your account
            </Link>
          </div>
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={revealViewport}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <p className="text-sm text-slate-500">
            © 2026 FlowMind. All rights reserved.
          </p>
          <Link
            href="/pricing"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Pricing
          </Link>
        </motion.div>
      </div>
    </footer>
  );
}

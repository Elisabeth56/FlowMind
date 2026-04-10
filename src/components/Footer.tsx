"use client";

import * as motion from "motion/react-client";
import { Brain, Twitter, Github, Linkedin, Mail } from "lucide-react";

const footerLinks = {
  Product: ["Features", "Pricing", "Integrations", "Changelog", "Roadmap"],
  Resources: ["Blog", "Documentation", "Help Center", "Community", "API"],
  Company: ["About", "Careers", "Press", "Contact", "Privacy"],
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Mail, href: "#", label: "Email" },
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
        viewport={{ once: true }}
        transition={{ duration: 1 }}
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
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
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
            className="grid grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-white font-medium mb-4">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href={`#${link.toLowerCase().replace(" ", "-")}`}
                        className="text-slate-400 text-sm hover:text-azure-400 transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Newsletter */}
        <motion.div
          className="bg-slate-800/50 rounded-2xl p-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Stay in the flow
              </h4>
              <p className="text-slate-400 text-sm">
                Get productivity tips and product updates. No spam, ever.
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-3 bg-slate-900 rounded-full text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:border-azure-500 transition-colors"
              />
              <button className="px-6 py-3 bg-azure-500 text-white font-medium rounded-full hover:bg-azure-600 transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-sm text-slate-500">
            © 2026 FlowMind. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#privacy"
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#terms"
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="#cookies"
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Cookie Policy
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

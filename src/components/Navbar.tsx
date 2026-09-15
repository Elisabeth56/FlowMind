"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as motion from "motion/react-client";
import { ArrowUpRight, Brain } from "lucide-react";

const navLinks = [
  { name: "Features", href: "/#features" },
  { name: "How It Works", href: "/#how-it-works" },
  { name: "Pricing", href: "/pricing" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const apply = () => {
      frame.current = null;
      setScrolled(window.scrollY > 50);
    };

    const handleScroll = () => {
      // Coalesce scroll events into one state update per frame, so the bar
      // doesn't re-render (and re-lay-out) dozens of times per flick.
      if (frame.current === null) {
        frame.current = window.requestAnimationFrame(apply);
      }
    };

    apply();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      // Only colour and shadow transition: the bar keeps a fixed height so
      // scrolling past the threshold can't nudge the page around.
      className={`fixed top-0 left-0 right-0 z-50 h-20 flex items-center transition-[background-color,box-shadow] duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-lg shadow-soft" : "bg-transparent"
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <motion.a
          href="/"
          className="flex items-center gap-2 text-2xl font-bold text-slate-900 tracking-tight"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Brain className="w-8 h-8 text-azure-500" />
          <span>flow<span className="text-azure-500">mind</span></span>
        </motion.a>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-slate-700 text-sm font-medium hover:text-azure-600 transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-azure-500 transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <motion.a
          href="/signup"
          className="flex items-center gap-2 px-5 py-2.5 bg-azure-500 text-white text-sm font-medium rounded-full hover:bg-azure-600 transition-all duration-300 hover:shadow-lg group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Start for free
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </motion.a>
      </div>
    </motion.nav>
  );
}

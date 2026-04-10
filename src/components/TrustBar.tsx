"use client";

import * as motion from "motion/react-client";

const partners = [
  { name: "TechCrunch", icon: "◆" },
  { name: "ProductHunt", icon: "▲" },
  { name: "Forbes", icon: "◈" },
  { name: "Wired", icon: "◉" },
  { name: "The Verge", icon: "◎" },
];

export default function TrustBar() {
  return (
    <section className="py-12 bg-white/50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.p
          className="text-center text-sm text-slate-500 mb-8 tracking-wide"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Featured in
        </motion.p>

        <motion.div
          className="flex flex-wrap items-center justify-center gap-8 md:gap-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              className="flex items-center gap-2 text-slate-400 opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-default"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 0.6, y: 0 }}
              whileHover={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <span className="text-xl">{partner.icon}</span>
              <span className="text-sm font-medium tracking-wide">{partner.name}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {[
            { value: "50K+", label: "Active users" },
            { value: "2M+", label: "Tasks organized" },
            { value: "98%", label: "Time saved" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-azure-600">{stat.value}</div>
              <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

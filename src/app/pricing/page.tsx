import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PricingPlans from '@/components/PricingPlans'
import PricingFaq from '@/components/PricingFaq'

export const metadata: Metadata = {
  title: 'Pricing — FlowMind',
  description:
    'Start free with 50 AI calls a month. Go Pro for unlimited AI organization, daily plans and weekly summaries.',
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-mist overflow-x-clip">
      <Navbar />

      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Same wash as the homepage hero, so the page reads as one site */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 50% at 50% -20%, rgba(56, 189, 248, 0.25) 0%, transparent 50%),
                radial-gradient(ellipse 60% 40% at 80% 70%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
                linear-gradient(180deg, #f0f7ff 0%, #e0efff 60%, #f0f7ff 100%)
              `,
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-slate-900 mb-6 leading-tight">
              Simple pricing for a
              <br />
              <span className="font-[family-name:var(--font-playfair)] italic text-azure-600">
                quieter mind
              </span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Start free and keep everything you capture. Upgrade when the AI has
              earned a permanent place in your week.
            </p>
          </div>

          <PricingPlans />
        </div>
      </section>

      <PricingFaq />
      <Footer />
    </main>
  )
}

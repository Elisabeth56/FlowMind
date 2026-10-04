import '@/components/landing/landing.css'
import { Footer } from '@/components/landing/Footer'
import { LandingNav } from '@/components/landing/LandingNav'
import { Ask, Capture, Closing, Hero, HowItWorks, Pricing, Today, Weekly } from '@/components/landing/Sections'

// The marketing page. `lp` scopes the motion in landing.css to this page.
export default function Home() {
  return (
    <div className="lp flex flex-col gap-24 overflow-x-clip bg-bg pb-12 text-ink md:gap-36">
      <LandingNav />
      <main className="contents">
        <Hero />
        <Capture />
        <HowItWorks />
        <Today />
        <Ask />
        <Weekly />
        <Pricing />
        <Closing />
      </main>
      <Footer />
    </div>
  )
}

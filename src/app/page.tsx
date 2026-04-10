import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import DailyPlan from "@/components/DailyPlan";
import WeeklySummary from "@/components/WeeklySummary";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-mist overflow-x-hidden">
      <Navbar />
      <Hero />
      <TrustBar />
      <Features />
      <HowItWorks />
      <DailyPlan />
      <WeeklySummary />
      <Footer />
    </main>
  );
}

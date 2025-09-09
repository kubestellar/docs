import Navigation from '@/components/sections/Navigation';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
import UseCasesSection from '@/components/sections/UseCasesSection';
import GetStartedSection from '@/components/sections/GetStartedSection';
import ContactSection from '@/components/sections/ContactSection';
import Footer from '@/components/sections/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <AboutSection />
      <HowItWorksSection />
      <UseCasesSection />
      <GetStartedSection />
      <ContactSection />
      <Footer />
    </main>
  );
}

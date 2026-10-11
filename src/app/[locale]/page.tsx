import HeroSection from "@/components/master-page/HeroSection";
import AboutSection from "@/components/master-page/AboutSection";
import UseCasesSection from "@/components/master-page/UseCasesSection";
import ContactSection from "@/components/master-page/ContactSection";
import { Navbar, Footer } from "@/components";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <UseCasesSection />
      <ContactSection />
      <Footer />
    </main>
  );
}

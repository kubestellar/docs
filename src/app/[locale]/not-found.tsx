import { Footer, GridLines, Navbar, StarField } from "@/components";
import NotFoundUI from "@/components/NotFoundUI";

export default function LocaleNotFound() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <GridLines />
        <StarField />
      </div>

      <div className="relative z-10">
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <NotFoundUI />
        </div>
        <Footer />
      </div>
    </div>
  );
}

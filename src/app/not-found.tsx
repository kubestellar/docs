import { Footer, GridLines, Navbar, StarField } from "@/components";
import { NextIntlClientProvider } from "next-intl";
import "./globals.css";
import { getLocale, getMessages } from "next-intl/server";
import NotFoundUI from "@/components/NotFoundUI";

export default async function NotFound() {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
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
    </NextIntlClientProvider>
  );
}

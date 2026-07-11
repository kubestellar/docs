import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import NotFoundUI from "@/components/NotFoundUI";

// NOTE: this page deliberately does NOT render Navbar / GridLines / StarField.
// The 404 page is served during deploy propagation windows when the previous
// deploy's hashed CSS bundle can 404; those components rely entirely on
// Tailwind classes (including unsized inline SVGs) and render broken without
// CSS. NotFoundUI is fully self-contained (inline styles only) so it can
// never render unstyled. See src/components/NotFoundUI.tsx.
export default async function NotFound() {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <NotFoundUI />
    </NextIntlClientProvider>
  );
}

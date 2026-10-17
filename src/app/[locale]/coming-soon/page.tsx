"use client";

import { ComingSoonCTA } from "@/components";
import ComingSoonHero from "@/components/ComingSoonHero";
import PageShell from "@/components/master-page/PageShell";

export default function ComingSoonPage() {
  return (
    <PageShell>
      <ComingSoonHero />

      {/* Call to Action */}
      <ComingSoonCTA />
    </PageShell>
  );
}

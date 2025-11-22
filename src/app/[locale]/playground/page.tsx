"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import Loader from "@/components/animations/Loader";

export default function PlaygroundPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/coming-soon");
  }, [router]);

  return <Loader />;
}

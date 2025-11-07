"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Loader from "@/components/animations/Loader";

// Dynamically import the terminal component
const Terminal = dynamic(
  () => import("@/components/playground/Terminal"),
  {
    ssr: false,
    loading: () => <Loader />,
  }
);

export default function RishiPlaygroundPage() {
  return (
    <Suspense fallback={<Loader />}>
      <Terminal />
    </Suspense>
  );
}
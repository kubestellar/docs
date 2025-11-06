"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

export default function PlaygroundPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to coming-soon page
    router.replace("/coming-soon");
  }, [router]);

  // Optional: Show a loading state while redirecting
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
}

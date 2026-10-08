"use client";

import { useState, FormEvent } from "react";

export interface UseNewsletterSubscribeResult {
  email: string;
  setEmail: (email: string) => void;
  handleSubscribe: (e: FormEvent) => void;
}

/**
 * useNewsletterSubscribe owns the footer newsletter form's email state and
 * submit handler (placeholder — subscriptions are not wired to a backend
 * yet, so submit just alerts and clears the field).
 *
 * Extracted from Footer.tsx and DocsFooter.tsx, which each open-coded a
 * byte-identical copy of this state + handler, following the same
 * hook-extraction pattern as useBackToTop (#7238/#7239) and useContactForm.
 */
export function useNewsletterSubscribe(): UseNewsletterSubscribeResult {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    window.alert("Subscriptions are not available yet. Please try again later.");
    setEmail("");
  };

  return { email, setEmail, handleSubscribe };
}

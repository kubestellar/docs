"use client";

import { useState } from "react";

import { gtagEvent } from "@/components/GoogleAnalytics";

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  privacy: boolean;
}

const EMPTY_FORM: ContactFormData = {
  name: "",
  email: "",
  subject: "",
  message: "",
  privacy: false,
};

/** How long the success banner stays visible after a successful submit (ms). */
const SUCCESS_BANNER_MS = 8000;

export interface UseContactFormResult {
  formData: ContactFormData;
  isSubmitting: boolean;
  showSuccess: boolean;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * useContactForm owns the Netlify-forms contact form's state and submission
 * flow (validation, POST, success banner, reset).
 *
 * Extracted from ContactSection.tsx, which open-coded this ~75-line form
 * handler alongside ~510 lines of JSX, following the same hook-extraction
 * pattern as useCounterAnimation (#7086/#7087) and useFeatureCardAnimations.
 *
 * Fires a bounded `contact_form_submit` GA4 event (status: "success" |
 * "error" only — never field content) on every submit outcome, matching
 * the gtagEvent instrumentation already present on docs search and the
 * ACMM leaderboard (src/components/docs/navbar/useDocsSearch.ts,
 * src/app/[locale]/acmm-leaderboard/page.tsx). Before this, a failed
 * contact submission was only visible as an unstructured console.error in
 * the visitor's own browser console — never observable in GA4 or any
 * server-side log.
 */
export function useContactForm(): UseContactFormResult {
  const [formData, setFormData] = useState<ContactFormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.privacy) {
      alert("Please agree to the privacy policy to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formPayload = new URLSearchParams({
        "form-name": "contact",
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });

      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formPayload.toString(),
      });

      if (!res.ok) throw new Error("Form submission failed");

      gtagEvent("contact_form_submit", { status: "success" });
      setShowSuccess(true);
      setFormData(EMPTY_FORM);

      setTimeout(() => setShowSuccess(false), SUCCESS_BANNER_MS);
    } catch (error) {
      console.error("Submission error:", error);
      // Bounded label: only a fixed success/error status, never the
      // error message or any form field content (name/email/message).
      gtagEvent("contact_form_submit", { status: "error" });
      alert("Submission failed. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { formData, isSubmitting, showSuccess, handleInputChange, handleSubmit };
}

"use client";

import { useState } from "react";

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

      setShowSuccess(true);
      setFormData(EMPTY_FORM);

      setTimeout(() => setShowSuccess(false), SUCCESS_BANNER_MS);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Submission failed. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { formData, isSubmitting, showSuccess, handleInputChange, handleSubmit };
}

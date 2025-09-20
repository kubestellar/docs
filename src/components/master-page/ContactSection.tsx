"use client";

import {useState, useEffect } from "react";
import StarField from "../StarField";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    privacy: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.privacy) {
      alert('Please agree to the privacy policy to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create mailto link for Google Groups mailing list
      const subject = encodeURIComponent(`[KubeStellar] ${formData.subject}`);
      const body = encodeURIComponent(
        `Hi KubeStellar Community,

Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}

Best regards,
${formData.name}

---
This message was sent via the KubeStellar website contact form.
Google Groups: https://groups.google.com/g/kubestellar-dev`
      );
      
      const mailtoLink = `mailto:kubestellar-dev@googlegroups.com?subject=${subject}&body=${body}`;
      
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Open email client
      window.location.href = mailtoLink;
      
      // Show success message
      setShowSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        privacy: false
      });
      
      // Hide success message after 8 seconds
      setTimeout(() => setShowSuccess(false), 8000);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error opening your email client. Please try again or visit https://groups.google.com/g/kubestellar-dev directly.');
    } finally {
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    const createGrid = (container: HTMLElement) => {
      if (!container) return;
      container.innerHTML = "";

      const gridSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      gridSvg.setAttribute("width", "100%");
      gridSvg.setAttribute("height", "100%");
      gridSvg.style.position = "absolute";
      gridSvg.style.top = "0";
      gridSvg.style.left = "0";

      for (let i = 0; i < 8; i++) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", "0");
        line.setAttribute("y1", `${i * 12}%`);
        line.setAttribute("x2", "100%");
        line.setAttribute("y2", `${i * 12}%`);
        line.setAttribute("stroke", "#6366F1");
        line.setAttribute("stroke-width", "0.5");
        line.setAttribute("stroke-opacity", "0.3");
        gridSvg.appendChild(line);
      }

      for (let i = 0; i < 8; i++) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", `${i * 12}%`);
        line.setAttribute("y1", "0");
        line.setAttribute("x2", `${i * 12}%`);
        line.setAttribute("y2", "100%");
        line.setAttribute("stroke", "#6366F1");
        line.setAttribute("stroke-width", "0.5");
        line.setAttribute("stroke-opacity", "0.3");
        gridSvg.appendChild(line);
      }

      container.appendChild(gridSvg);
    };

    const gridContainer = document.getElementById("grid-lines-contact");

    if (gridContainer) createGrid(gridContainer);
  }, []);

  return (
    <section
      id="contact"
      className="relative py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden"
    >
      {/* Dark base background */}
      <div className="absolute inset-0 bg-[#0a0a0a]"></div>

      {/* Starfield background */}
      <StarField density="medium" showComets={true} cometCount={4} />

      {/* Grid lines background */}
      <div id="grid-lines-contact" className="absolute inset-0 opacity-20"></div>

      {/* Background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-b from-purple-500/10 to-transparent rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-t from-blue-500/10 to-transparent rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="text-gradient">Get in Touch</span>
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-300">
            Have questions about KubeStellar? We&apos;re here to help!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Left side: Contact info cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact card 1 */}
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl shadow-sm border border-gray-700/50 p-6 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-900/30 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-white">Email Us</h3>
                  <p className="text-gray-300 mt-1">info@kubestellar.io</p>
                </div>
              </div>
            </div>

            {/* Contact card 2 */}
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl shadow-sm border border-gray-700/50 p-6 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-900/30 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    ></path>
                  </svg>
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-white">
                    Join Our Community
                  </h3>
                  <p className="text-gray-300 mt-1">kubestellar.slack.com</p>
                </div>
              </div>
            </div>

            {/* Contact card 3 */}
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl shadow-sm border border-gray-700/50 p-6 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-900/30 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                    />
                  </svg>
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-white">GitHub</h3>
                  <p className="text-gray-300 mt-1">github.com/kubestellar</p>
                </div>
              </div>
            </div>

            {/* Contact card 4 - Medium */}
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl shadow-sm border border-gray-700/50 p-6 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-orange-900/30 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-orange-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75S24 8.83 24 12z"/>
                  </svg>
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-white">Medium Blog</h3>
                  <p className="text-gray-300 mt-1">medium.com/@kubestellar</p>
                </div>
              </div>
            </div>

            {/* Social media links */}
            <div className="flex justify-center lg:justify-start space-x-8 mt-8">
              <a
                href="#"
                className="text-gray-400 hover:text-blue-500 transition-all duration-300 transform hover:scale-110"
                aria-label="Twitter"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="h-8 w-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>

              <a
                href="#"
                className="text-gray-400 hover:text-blue-600 transition-all duration-300 transform hover:scale-110"
                aria-label="LinkedIn"
              >
                <span className="sr-only">LinkedIn</span>
                <svg
                  className="h-8 w-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>

              <a
                href="https://github.com/kubestellar/kubestellar"
                className="text-gray-400 hover:text-gray-300 transition-all duration-300 transform hover:scale-110"
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">GitHub</span>
                <svg
                  className="h-8 w-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </a>
            </div>
          </div>

          {/* Right side: Contact form */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
              <div className="p-8 sm:p-10">
                <h3 className="text-2xl font-bold text-white mb-8 text-center">
                  Send us a message
                </h3>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-semibold text-gray-300 mb-2"
                      >
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm"
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-gray-300 mb-2"
                      >
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-semibold text-gray-300 mb-2"
                    >
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm"
                    >
                      <option value="">Select a subject</option>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Documentation Feedback">Documentation Feedback</option>
                      <option value="Enterprise Solutions">Enterprise Solutions</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-semibold text-gray-300 mb-2"
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-700/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm resize-none"
                      placeholder="Tell us about your use case and how we can help..."
                    ></textarea>
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      id="privacy"
                      name="privacy"
                      type="checkbox"
                      checked={formData.privacy}
                      onChange={handleInputChange}
                      required
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
                    />
                    <label
                      htmlFor="privacy"
                      className="text-sm text-gray-300 leading-relaxed"
                    >
                      I agree to the{" "}
                      <a
                        href="#"
                        className="text-blue-400 hover:text-blue-300 underline transition-colors duration-200"
                      >
                        privacy policy
                      </a>{" "}
                      and consent to being contacted by the KubeStellar team.
                    </label>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Sending...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <span>Send Message</span>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>
                </form>

                {/* Success Message */}
                {showSuccess && (
                  <div className="mt-4 rounded-xl bg-green-900/30 p-4 border border-green-500/30 backdrop-blur-sm">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-green-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-300">
                          Your email will be sent to the KubeStellar development mailing list. 
                          Please check your email client to complete sending!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Terminal,
  CheckCircle2,
  Copy,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Info,
  Shield,
  Settings,
} from "lucide-react";
import { Navbar, Footer, GridLines, StarField } from "@/components/index";

// Code block component with copy button
const CodeBlock = ({
  code,
  language = "bash",
}: {
  code: string;
  language?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative mb-4 overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900/50">
      <div className="flex items-center justify-between border-b border-gray-700/50 bg-gray-800/50 px-4 py-2">
        <span className="font-mono text-xs text-gray-400">{language}</span>
        <button
          onClick={copyToClipboard}
          className="rounded bg-gray-700/50 p-1.5 transition-all hover:bg-gray-600/50"
          aria-label="Copy code"
        >
          {copied ? (
            <CheckCircle2 size={14} className="text-emerald-400" />
          ) : (
            <Copy size={14} className="text-gray-400" />
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4">
        <pre className="whitespace-pre-wrap break-all font-mono text-sm text-emerald-300">
          {code}
        </pre>
      </div>
    </div>
  );
};

// Animated card component
const AnimatedCard = ({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) => (
  <div
    id={id}
    className={`bg-gray-800/50 backdrop-blur-md rounded-xl shadow-lg border border-gray-700/50 transition-all duration-300 hover:shadow-2xl hover:border-blue-500/50 ${className}`}
  >
    {children}
  </div>
);

// Section header component
const SectionHeader = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="mb-8">
    <div className="mb-2 flex items-center">
      <div className="mr-3 text-blue-400">{icon}</div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
    </div>
    <p className="ml-9 text-gray-300">{description}</p>
  </div>
);

// FAQ Item component
const FAQItem = ({
  faq,
}: {
  faq: { question: string; answer: string };
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-700/50 rounded-lg bg-gray-800/50 backdrop-blur-md transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-700/30 transition-colors duration-200 rounded-lg"
      >
        <h3 className="text-lg font-medium text-white pr-4">{faq.question}</h3>
        <div className="text-gray-400 flex-shrink-0">
          {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </button>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="px-6 pb-6 border-t border-gray-700/30">
            <p className="text-gray-300 leading-relaxed pt-4 whitespace-pre-line">{faq.answer}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const QuickInstallationPage = () => {
  const faqData = [
    {
      question: "What does the start.sh script do?",
      answer:
        "It downloads the latest Console and kc-agent binaries for your platform (macOS/Linux, arm64/amd64), starts the kc-agent daemon, launches the Console server on port 8080, and opens your browser. The whole process takes under a minute.",
    },
    {
      question: "Do I need Docker or Kind?",
      answer:
        "No. KubeStellar Console connects directly to clusters in your kubeconfig. You don't need Docker, Kind, KubeFlex, or any other local cluster tool. If you already have clusters, Console will discover them automatically.",
    },
    {
      question: "What is kc-agent?",
      answer:
        "kc-agent is a lightweight local agent that bridges the Console UI to your kubeconfig and MCP tools. It runs on localhost:8585 and only accepts connections from allowed origins. It never exposes your kubeconfig to the internet.",
    },
    {
      question: "Can I use Console without GitHub OAuth?",
      answer:
        'Yes. Without OAuth configured, Console runs in dev mode with a local user. GitHub OAuth is only needed for multi-user authentication and team-based access control. Set DEV_MODE=true in your .env to explicitly enable dev mode.',
    },
    {
      question: "How do I connect to the hosted Console?",
      answer:
        "Install kc-agent locally with `brew tap kubestellar/tap && brew install --head kc-agent`, run `kc-agent`, then visit console.kubestellar.io. The hosted Console connects to your local agent automatically.",
    },
    {
      question: "What Kubernetes distributions are supported?",
      answer:
        "Any distribution that provides a standard kubeconfig — OpenShift, GKE, EKS, AKS, Kind, k3d, Minikube, Rancher, Talos, and more. Console reads your kubeconfig and connects to whatever clusters are configured.",
    },
  ];

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="relative py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a0a]"></div>
        <StarField density="low" showComets={true} cometCount={2} />
        <GridLines />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">Install KubeStellar Console</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Less than a minute to get installed and started with your own AI-powered multi-cluster Kubernetes dashboard.
            </p>
          </div>

          {/* Step 1: One-Line Install */}
          <AnimatedCard className="mb-12 p-8">
            <SectionHeader
              icon={<Terminal size={24} />}
              title="Step 1: Install & Start"
              description="One command downloads Console and kc-agent, starts both, and opens your browser."
            />

            <CodeBlock code="curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/start.sh | bash" />

            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-6">
              <div className="flex items-start">
                <CheckCircle2
                  size={20}
                  className="mr-3 mt-0.5 flex-shrink-0 text-emerald-400"
                />
                <div>
                  <h4 className="mb-3 text-lg font-medium text-emerald-300">
                    What happens
                  </h4>
                  <ul className="space-y-2 text-emerald-200">
                    <li className="flex items-start">
                      <ChevronRight size={16} className="mr-2 mt-0.5 flex-shrink-0 text-emerald-400" />
                      Detects your OS and architecture (macOS/Linux, arm64/amd64)
                    </li>
                    <li className="flex items-start">
                      <ChevronRight size={16} className="mr-2 mt-0.5 flex-shrink-0 text-emerald-400" />
                      Downloads the latest Console and kc-agent binaries
                    </li>
                    <li className="flex items-start">
                      <ChevronRight size={16} className="mr-2 mt-0.5 flex-shrink-0 text-emerald-400" />
                      Starts kc-agent as a background daemon (port 8585)
                    </li>
                    <li className="flex items-start">
                      <ChevronRight size={16} className="mr-2 mt-0.5 flex-shrink-0 text-emerald-400" />
                      Starts Console on port 8080 and opens your browser
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </AnimatedCard>

          {/* Step 2: GitHub OAuth (Optional) */}
          <AnimatedCard className="mb-12 p-8">
            <SectionHeader
              icon={<Shield size={24} />}
              title="Step 2: GitHub OAuth (Optional)"
              description="Enable multi-user authentication with GitHub. Skip this for local dev use."
            />

            <div className="mb-6">
              <h3 className="mb-4 text-lg font-medium text-white">
                1. Create a GitHub OAuth App
              </h3>
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-6 mb-4">
                <div className="flex items-start">
                  <Info size={20} className="mr-3 mt-0.5 flex-shrink-0 text-blue-400" />
                  <div className="text-blue-200 space-y-2">
                    <p>Go to <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline hover:text-blue-200">GitHub Developer Settings → OAuth Apps → New OAuth App</a></p>
                    <ul className="space-y-1 ml-4">
                      <li>• <strong>Application name:</strong> KubeStellar Console</li>
                      <li>• <strong>Homepage URL:</strong> <code className="bg-gray-900/50 px-2 py-0.5 rounded text-sm">http://localhost:8080</code></li>
                      <li>• <strong>Callback URL:</strong> <code className="bg-gray-900/50 px-2 py-0.5 rounded text-sm">http://localhost:8080/auth/github/callback</code></li>
                    </ul>
                    <p className="text-sm text-blue-300/80 mt-2">After creating, copy the Client ID and generate a Client Secret.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-4 text-lg font-medium text-white">
                2. Create a .env file
              </h3>
              <CodeBlock
                code={`cat > .env << EOF
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
EOF`}
              />
            </div>

            <div>
              <h3 className="mb-4 text-lg font-medium text-white">
                3. Restart Console
              </h3>
              <CodeBlock code="curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/start.sh | bash" />
              <p className="text-gray-400 text-sm">Console reads the .env file on startup and enables GitHub OAuth automatically.</p>
            </div>
          </AnimatedCard>

          {/* Environment Variables Reference */}
          <AnimatedCard className="mb-12 p-8">
            <SectionHeader
              icon={<Settings size={24} />}
              title="Environment Variables"
              description="All configuration options for the .env file."
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="pb-3 pr-6 text-gray-400 font-medium">Variable</th>
                    <th className="pb-3 pr-6 text-gray-400 font-medium">Description</th>
                    <th className="pb-3 text-gray-400 font-medium">Default</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b border-gray-700/30">
                    <td className="py-3 pr-6"><code className="text-blue-300 bg-gray-900/50 px-2 py-0.5 rounded text-xs">GITHUB_CLIENT_ID</code></td>
                    <td className="py-3 pr-6 text-gray-300">GitHub OAuth App Client ID</td>
                    <td className="py-3 text-gray-400">—</td>
                  </tr>
                  <tr className="border-b border-gray-700/30">
                    <td className="py-3 pr-6"><code className="text-blue-300 bg-gray-900/50 px-2 py-0.5 rounded text-xs">GITHUB_CLIENT_SECRET</code></td>
                    <td className="py-3 pr-6 text-gray-300">GitHub OAuth App Client Secret</td>
                    <td className="py-3 text-gray-400">—</td>
                  </tr>
                  <tr className="border-b border-gray-700/30">
                    <td className="py-3 pr-6"><code className="text-blue-300 bg-gray-900/50 px-2 py-0.5 rounded text-xs">DEV_MODE</code></td>
                    <td className="py-3 pr-6 text-gray-300">Skip OAuth, use local dev-user</td>
                    <td className="py-3 text-gray-400">true (when no OAuth configured)</td>
                  </tr>
                  <tr className="border-b border-gray-700/30">
                    <td className="py-3 pr-6"><code className="text-blue-300 bg-gray-900/50 px-2 py-0.5 rounded text-xs">FRONTEND_URL</code></td>
                    <td className="py-3 pr-6 text-gray-300">Frontend URL for CORS</td>
                    <td className="py-3 text-gray-400">http://localhost:5174</td>
                  </tr>
                  <tr className="border-b border-gray-700/30">
                    <td className="py-3 pr-6"><code className="text-blue-300 bg-gray-900/50 px-2 py-0.5 rounded text-xs">CLAUDE_API_KEY</code></td>
                    <td className="py-3 pr-6 text-gray-300">Anthropic API key for AI missions</td>
                    <td className="py-3 text-gray-400">—</td>
                  </tr>
                  <tr className="border-b border-gray-700/30">
                    <td className="py-3 pr-6"><code className="text-blue-300 bg-gray-900/50 px-2 py-0.5 rounded text-xs">KC_ALLOWED_ORIGINS</code></td>
                    <td className="py-3 pr-6 text-gray-300">Additional allowed CORS origins for kc-agent</td>
                    <td className="py-3 text-gray-400">localhost only</td>
                  </tr>
                  <tr className="border-b border-gray-700/30">
                    <td className="py-3 pr-6"><code className="text-blue-300 bg-gray-900/50 px-2 py-0.5 rounded text-xs">KC_AGENT_TOKEN</code></td>
                    <td className="py-3 pr-6 text-gray-300">Shared secret for kc-agent auth</td>
                    <td className="py-3 text-gray-400">—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <h3 className="mb-4 text-lg font-medium text-white">
                Example .env with all options
              </h3>
              <CodeBlock
                code={`# GitHub OAuth (optional - enables multi-user auth)
GITHUB_CLIENT_ID=Iv23li...
GITHUB_CLIENT_SECRET=ed5de5...

# AI Missions (optional - enables natural language operations)
CLAUDE_API_KEY=sk-ant-...

# Dev mode (set false to require GitHub auth)
DEV_MODE=false

# kc-agent settings (optional)
KC_ALLOWED_ORIGINS=https://my-console.example.com
KC_AGENT_TOKEN=my-shared-secret`}
              />
            </div>
          </AnimatedCard>

          {/* Alternative Install Methods */}
          <AnimatedCard className="mb-12 p-8">
            <SectionHeader
              icon={<ExternalLink size={24} />}
              title="Alternative Installation Methods"
              description="Other ways to run KubeStellar Console."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Homebrew */}
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Homebrew (kc-agent only)</h3>
                <p className="text-sm text-gray-400 mb-4">Install kc-agent and use the hosted Console at console.kubestellar.io.</p>
                <CodeBlock code={`brew tap kubestellar/tap
brew install --head kc-agent
kc-agent`} />
                <p className="text-sm text-gray-400">Then visit <a href="https://console.kubestellar.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">console.kubestellar.io</a></p>
              </div>

              {/* Docker */}
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Docker</h3>
                <p className="text-sm text-gray-400 mb-4">Run Console as a container with your kubeconfig mounted.</p>
                <CodeBlock code={`docker run -d -p 8080:8080 \\
  -e GITHUB_CLIENT_ID=xxx \\
  -e GITHUB_CLIENT_SECRET=yyy \\
  -v ~/.kube:/root/.kube:ro \\
  kubestellar/console:latest`} />
              </div>

              {/* Kubernetes / Helm */}
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Kubernetes (Helm)</h3>
                <p className="text-sm text-gray-400 mb-4">Deploy Console to a Kubernetes cluster with Helm.</p>
                <CodeBlock code={`helm repo add kubestellar-console \\
  https://kubestellar.github.io/console
helm repo update
helm install kc kubestellar-console/kubestellar-console \\
  --namespace kubestellar-console --create-namespace`} />
              </div>

              {/* One-line deploy.sh */}
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Deploy Script (K8s)</h3>
                <p className="text-sm text-gray-400 mb-4">One-line deploy to any Kubernetes cluster.</p>
                <CodeBlock code={`curl -sSL https://raw.githubusercontent.com/kubestellar/console/main/deploy.sh | bash`} />
                <p className="text-sm text-gray-400">Requires <code className="text-xs bg-gray-900/50 px-1 rounded">helm</code> and <code className="text-xs bg-gray-900/50 px-1 rounded">kubectl</code> configured.</p>
              </div>
            </div>
          </AnimatedCard>

          {/* FAQ Section */}
          <AnimatedCard className="p-8">
            <SectionHeader
              icon={<Info size={24} />}
              title="Frequently Asked Questions"
              description="Common questions about installing and running KubeStellar Console."
            />

            <div className="space-y-4">
              {faqData.map((faq, i) => (
                <FAQItem key={i} faq={faq} />
              ))}
            </div>
          </AnimatedCard>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default QuickInstallationPage;

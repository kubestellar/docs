"use client";

import { GridLines, StarField } from "../index";
import { useTranslations } from "next-intl";

export default function HowItWorksSection() {
  const t = useTranslations("howItWorksSection");
  return (
    <section
      id="how-it-works"
      className="relative py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden will-change-transform"
    >
      {/* Dark base background */}
      <div className="absolute inset-0 bg-[#0a0a0a]"></div>

      {/* Starfield background */}
      <StarField density="medium" showComets={true} cometCount={3} />

      {/* Grid lines background */}
      <GridLines horizontalLines={21} verticalLines={18} />

      <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-blue-500/10 to-transparent"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-3xl font-extrabold text-white sm:text-[2.4rem]">
            How to Use{" "}
            <span className="text-gradient animated-gradient bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600">
              KubeStellar
            </span>
          </h2>
          <p className="mt-3 sm:mt-4 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-gray-300 px-4">
            Follow these 5 simple steps to get started with KubeStellar multi-cluster orchestration
          </p>
        </div>

        {/* Mobile Steps Layout */}
        <div className="lg:hidden relative z-10">
          {/* Mobile Step 1 */}
          <div className="mb-8">
            <div className="bg-gray-800/40 backdrop-blur-md rounded-lg p-4 border border-white/10 relative">
              {/* Step Number at Top */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-lg font-bold text-white mb-2 text-center">
                  Set Up Your Environment
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-3 text-center">
                  Install required tools and initialize core components
                </p>
                <div className="bg-slate-900/90 rounded-lg p-3 overflow-x-auto">
                  <pre className="text-xs font-mono text-white">
                    <code>
                      <span className="text-gray-400"># Install required tools</span>
                      {"\n"}
                      <span className="text-blue-400">kubectl</span>, <span className="text-blue-400">helm</span>, <span className="text-blue-400">docker</span>, <span className="text-blue-400">kind/k3d</span>
                      {"\n"}
                      <span className="text-blue-400">KubeFlex</span>
                      {"\n"}
                      <span className="text-blue-400">Open Cluster Management (OCM) CLI</span>
                    </code>
                  </pre>
                </div>
              </div>
            </div>
            {/* Mobile Connector */}
            <div className="flex justify-center mt-4">
              <div className="w-0.5 h-6 bg-gradient-to-b from-blue-500 to-purple-500"></div>
            </div>
          </div>

          {/* Mobile Step 2 */}
          <div className="mb-8">
            <div className="bg-gray-800/40 backdrop-blur-md rounded-lg p-4 border border-white/10 relative">
              {/* Step Number at Top */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-lg font-bold text-white mb-2 text-center">
                  Register and Label Clusters
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-3 text-center">
                  Register WECs and apply labels for targeting
                </p>
                <div className="bg-slate-900/90 rounded-lg p-3 overflow-x-auto">
                  <pre className="text-xs font-mono text-white">
                    <code>
                      <span className="text-gray-400"># Example cluster labeling</span>
                      {"\n"}
                      <span className="text-blue-400">kubectl label managedcluster</span> <span className="text-white">cluster1</span> \
                      {"\n"}
                      <span className="text-emerald-400">location-group=edge</span> \
                      {"\n"}
                      <span className="text-emerald-400">name=cluster1</span>
                    </code>
                  </pre>
                </div>
              </div>
            </div>
            {/* Mobile Connector */}
            <div className="flex justify-center mt-4">
              <div className="w-0.5 h-6 bg-gradient-to-b from-purple-500 to-green-500"></div>
            </div>
          </div>

          {/* Mobile Step 3 */}
          <div className="mb-8">
            <div className="bg-gray-800/40 backdrop-blur-md rounded-lg p-4 border border-white/10 relative">
              {/* Step Number at Top */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-lg font-bold text-white mb-2 text-center">
                  Define Workload Placement
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-3 text-center">
                  Create BindingPolicy objects to specify deployment rules
                </p>
                <div className="bg-slate-900/90 rounded-lg p-3 overflow-x-auto">
                  <pre className="text-xs font-mono text-white">
                    <code>
                      <span className="text-yellow-300">apiVersion</span>: <span className="text-white">control.kubestellar.io/v1alpha1</span>
                      {"\n"}
                      <span className="text-yellow-300">kind</span>: <span className="text-white">BindingPolicy</span>
                      {"\n"}
                      <span className="text-yellow-300">spec</span>:
                      {"\n"}
                      {"  "}<span className="text-yellow-300">clusterSelectors</span>:
                      {"\n"}
                      {"  - "}<span className="text-yellow-300">matchLabels</span>:
                      {"\n"}
                      {"      "}<span className="text-emerald-400">location-group: edge</span>
                    </code>
                  </pre>
                </div>
              </div>
            </div>
            {/* Mobile Connector */}
            <div className="flex justify-center mt-4">
              <div className="w-0.5 h-6 bg-gradient-to-b from-green-500 to-orange-500"></div>
            </div>
          </div>

          {/* Mobile Step 4 */}
          <div className="mb-8">
            <div className="bg-gray-800/40 backdrop-blur-md rounded-lg p-4 border border-white/10 relative">
              {/* Step Number at Top */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">4</span>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-lg font-bold text-white mb-2 text-center">
                  Deploy Your Workloads
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-3 text-center">
                  Deploy workloads in native Kubernetes format
                </p>
                <div className="bg-slate-900/90 rounded-lg p-3 overflow-x-auto">
                  <pre className="text-xs font-mono text-white">
                    <code>
                      <span className="text-yellow-300">apiVersion</span>: <span className="text-white">apps/v1</span>
                      {"\n"}
                      <span className="text-yellow-300">kind</span>: <span className="text-white">Deployment</span>
                      {"\n"}
                      <span className="text-yellow-300">metadata</span>:
                      {"\n"}
                      {"  "}<span className="text-yellow-300">name</span>: <span className="text-white">example-app</span>
                      {"\n"}
                      {"  "}<span className="text-yellow-300">labels</span>:
                      {"\n"}
                      {"    "}<span className="text-emerald-400">app.kubernetes.io/name: myapp</span>
                    </code>
                  </pre>
                </div>
              </div>
            </div>
            {/* Mobile Connector */}
            <div className="flex justify-center mt-4">
              <div className="w-0.5 h-6 bg-gradient-to-b from-orange-500 to-pink-500"></div>
            </div>
          </div>

          {/* Mobile Step 5 */}
          <div className="mb-8">
            <div className="bg-gray-800/40 backdrop-blur-md rounded-lg p-4 border border-white/10 relative">
              {/* Step Number at Top */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">5</span>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-lg font-bold text-white mb-2 text-center">
                  Monitor and Manage
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-3 text-center">
                  Monitor deployment status and manage workload health
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <div className="bg-blue-900/80 backdrop-blur-lg rounded-full px-3 py-1 text-white text-xs">
                    Status Collection
                  </div>
                  <div className="bg-purple-900/80 backdrop-blur-lg rounded-full px-3 py-1 text-white text-xs">
                    Health Monitoring
                  </div>
                  <div className="bg-green-900/80 backdrop-blur-lg rounded-full px-3 py-1 text-white text-xs">
                    Policy Management
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block relative z-10">
          {/* Connection Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 via-green-500 via-orange-500 to-pink-500 z-5 transform -translate-x-1/2 will-change-transform"></div>

          {/* Desktop Step 1 */}
          <div className="relative mb-16 lg:mb-20 z-20">
            <div className="flex flex-row items-center">
              <div className="w-1/2 pr-12">
                <div className="relative bg-gray-800/40 backdrop-blur-md rounded-lg p-6 border border-white/10 z-30 transition-all duration-300 hover:bg-gray-800/50 hover:border-white/20">
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 mr-3 text-white font-bold text-sm">
                      1
                    </span>
                    Set Up Your Environment
                  </h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Install required tools and initialize core components including KubeFlex hosting cluster, ITS, WDS, and WECs.
                  </p>
                  <div className="bg-slate-900/90 rounded-lg overflow-hidden shadow-lg w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    <pre className="text-sm font-mono text-white p-4 leading-6 whitespace-pre-wrap">
                      <code>
                        <span className="text-gray-400"># Install required tools</span>
                        {"\n"}
                        <span className="text-blue-400">kubectl</span>, <span className="text-blue-400">helm</span>, <span className="text-blue-400">docker</span>, <span className="text-blue-400">kind/k3d</span>
                        {"\n"}
                        <span className="text-blue-400">KubeFlex</span>
                        {"\n"}
                        <span className="text-blue-400">Open Cluster Management (OCM) CLI</span>
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
              <div className="w-1/2 pl-12"></div>
            </div>
          </div>

          {/* Desktop Step 2 */}
          <div className="relative mb-16 lg:mb-20 z-20">
            <div className="flex flex-row-reverse items-center">
              <div className="w-1/2 pl-12">
                <div className="relative bg-gray-800/40 backdrop-blur-md rounded-lg p-6 border border-white/10 z-30 transition-all duration-300 hover:bg-gray-800/50 hover:border-white/20">
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 mr-3 text-white font-bold text-sm">
                      2
                    </span>
                    Register and Label Clusters
                  </h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Register WECs with the ITS using OCM, apply labels to clusters for targeting, and establish secure connections.
                  </p>
                  <div className="bg-slate-900/90 rounded-lg overflow-hidden shadow-lg w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    <pre className="text-sm font-mono text-white p-4 leading-6 whitespace-pre-wrap">
                      <code>
                        <span className="text-gray-400"># Example cluster labeling</span>
                        {"\n"}
                        <span className="text-blue-400">kubectl label managedcluster</span> <span className="text-white">cluster1</span> \
                        {"\n"}
                        <span className="text-emerald-400">location-group=edge</span> \
                        {"\n"}
                        <span className="text-emerald-400">name=cluster1</span>
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
              <div className="w-1/2 pr-12"></div>
            </div>
          </div>

          {/* Desktop Step 3 */}
          <div className="relative mb-16 lg:mb-20 z-20">
            <div className="flex flex-row items-center">
              <div className="w-1/2 pr-12">
                <div className="relative bg-gray-800/40 backdrop-blur-md rounded-lg p-6 border border-white/10 z-30 transition-all duration-300 hover:bg-gray-800/50 hover:border-white/20">
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 mr-3 text-white font-bold text-sm">
                      3
                    </span>
                    Define Workload Placement
                  </h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Create BindingPolicy objects to specify which clusters receive workloads and which workloads to distribute.
                  </p>
                  <div className="bg-slate-900/90 rounded-lg overflow-hidden shadow-lg w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    <pre className="text-sm font-mono text-white p-4 leading-6 whitespace-pre-wrap">
                      <code>
                        <span className="text-yellow-300">apiVersion</span>: <span className="text-white">control.kubestellar.io/v1alpha1</span>
                        {"\n"}
                        <span className="text-yellow-300">kind</span>: <span className="text-white">BindingPolicy</span>
                        {"\n"}
                        <span className="text-yellow-300">metadata</span>:
                        {"\n"}
                        {"  "}<span className="text-yellow-300">name</span>: <span className="text-white">example-policy</span>
                        {"\n"}
                        <span className="text-yellow-300">spec</span>:
                        {"\n"}
                        {"  "}<span className="text-yellow-300">clusterSelectors</span>:
                        {"\n"}
                        {"  - "}<span className="text-yellow-300">matchLabels</span>:
                        {"\n"}
                        {"      "}<span className="text-emerald-400">location-group: edge</span>
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
              <div className="w-1/2 pl-12"></div>
            </div>
          </div>

          {/* Desktop Step 4 */}
          <div className="relative mb-16 lg:mb-20 z-20">
            <div className="flex flex-row-reverse items-center">
              <div className="w-1/2 pl-12">
                <div className="relative bg-gray-800/40 backdrop-blur-md rounded-lg p-6 border border-white/10 z-30 transition-all duration-300 hover:bg-gray-800/50 hover:border-white/20">
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-600 mr-3 text-white font-bold text-sm">
                      4
                    </span>
                    Deploy Your Workloads
                  </h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Deploy workloads in native Kubernetes format using kubectl apply, Helm charts, ArgoCD, or Custom Resources.
                  </p>
                  <div className="bg-slate-900/90 rounded-lg overflow-hidden shadow-lg w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    <pre className="text-sm font-mono text-white p-4 leading-6 whitespace-pre-wrap">
                      <code>
                        <span className="text-yellow-300">apiVersion</span>: <span className="text-white">apps/v1</span>
                        {"\n"}
                        <span className="text-yellow-300">kind</span>: <span className="text-white">Deployment</span>
                        {"\n"}
                        <span className="text-yellow-300">metadata</span>:
                        {"\n"}
                        {"  "}<span className="text-yellow-300">name</span>: <span className="text-white">example-app</span>
                        {"\n"}
                        {"  "}<span className="text-yellow-300">labels</span>:
                        {"\n"}
                        {"    "}<span className="text-emerald-400">app.kubernetes.io/name: myapp</span>
                        {"\n"}
                        <span className="text-yellow-300">spec</span>:
                        {"\n"}
                        {"  "}<span className="text-yellow-300">replicas</span>: <span className="text-white">3</span>
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
              <div className="w-1/2 pr-12"></div>
            </div>
          </div>

          {/* Desktop Step 5 */}
          <div className="relative z-20">
            <div className="flex flex-row items-center">
              <div className="w-1/2 pr-12">
                <div className="relative bg-gray-800/40 backdrop-blur-md rounded-lg p-6 border border-white/10 z-30 transition-all duration-300 hover:bg-gray-800/50 hover:border-white/20">
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-pink-600 mr-3 text-white font-bold text-sm">
                      5
                    </span>
                    Monitor and Manage
                  </h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Monitor deployment status across clusters, view workload health, collect status information, and manage policy compliance.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-900/80 backdrop-blur-lg rounded-full px-3 py-2 text-white text-sm flex items-center justify-center transition-all duration-300 hover:bg-blue-900/90 hover:scale-105">
                      <div className="text-sm opacity-70 font-semibold text-center">
                        Status Collection
                      </div>
                    </div>
                    <div className="bg-purple-900/80 backdrop-blur-lg rounded-full px-3 py-2 text-white text-sm flex items-center justify-center transition-all duration-300 hover:bg-purple-900/90 hover:scale-105">
                      <div className="text-sm opacity-70 font-semibold text-center">
                        Health Monitoring
                      </div>
                    </div>
                    <div className="bg-green-900/80 backdrop-blur-lg rounded-full px-3 py-2 text-white text-sm flex items-center justify-center transition-all duration-300 hover:bg-green-900/90 hover:scale-105">
                      <div className="text-sm opacity-70 font-semibold text-center">
                        Policy Management
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-1/2 pl-12"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

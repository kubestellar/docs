"use client";

import StarField from "../StarField";
import GridBackground from "../GridBackground";

export default function UseCasesSection() {
  const useCases = [
    {
      icon: (
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: "Edge Computing",
      description:
        "Deploy applications across edge locations with centralized management. Ideal for retail, manufacturing, and telecom with distributed infrastructure.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: (
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      title: "Multi-Region Compliance",
      description:
        "Deploy applications with specific regional compliance requirements. Ensure data residency and regulatory compliance across global operations.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: (
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: "Hybrid/Multi-Cloud",
      description:
        "Seamlessly manage workloads across multiple cloud providers and on-premises infrastructure with unified policies and consistent experience.",
      color: "from-green-500 to-teal-500",
    },
    {
      icon: (
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
      ),
      title: "Disaster Recovery",
      description:
        "Implement robust disaster recovery strategies with automatic workload replication and failover across multiple clusters in different regions.",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: (
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      title: "Multi-Tenant Isolation",
      description:
        "Create isolated environments for different teams or customers while maintaining centralized control. Ideal for SaaS providers and large enterprises.",
      color: "from-indigo-500 to-purple-500",
    },
    {
      icon: (
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      title: "Performance Optimization",
      description:
        "Deploy workloads closest to users or data sources for optimal performance, reducing latency and improving user experience across global operations.",
      color: "from-yellow-500 to-orange-500",
    },
  ];

  return (
    <section
      id="use-cases"
      className="relative py-16 text-white overflow-hidden"
    >
      {/* Dark base background matching the image */}
      <div className="absolute inset-0 bg-[#0a0a0a]"></div>

      {/* Starfield background */}
      <StarField density="medium" showComets={true} cometCount={4} />

      {/* Grid lines background */}
      <GridBackground
        color="#6366F1"
        opacity={0.15}
        strokeWidth={0.3}
        spacing={60}
        animated={true}
        className="absolute inset-0"
      />


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">
              Use Cases
            </span>
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-300">
            Discover how organizations leverage KubeStellar for their
            multi-cluster needs.
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-items-center">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className={`group relative rounded-lg overflow-hidden border border-gray-700 transition-all duration-300 ${useCase.hoverBorderColor} hover:shadow-2xl hover:shadow-gray-900/50 hover:-translate-y-2 hover:scale-105 cursor-pointer w-full max-w-sm h-[280px] bg-gray-800 z-10`}
            >
              {/* Top colored border */}
              <div className={`h-2 ${useCase.borderColor}`}></div>

              <div className="p-6">
                {/* Logo container */}
                <div
                  className={`${useCase.iconBgColor} rounded-lg flex items-center justify-center mb-4 w-12 h-12`}
                >
                  {getIcon(useCase.icon)}
                </div>

                {/* Main heading */}
                <h3 className="font-bold text-white mb-4 transition-colors duration-300 group-hover:text-blue-300 text-lg leading-7 overflow-hidden">
                  {useCase.title}
                </h3>

                {/* Description text */}
                <p className="text-gray-300 font-normal mb-2 transition-colors duration-300 group-hover:text-gray-200 text-sm leading-5 overflow-hidden line-clamp-4">
                  {useCase.description}
                </p>

                {/* Learn more button */}
                <button className="text-blue-400 font-medium hover:text-blue-300 transition-all duration-300 flex items-center text-sm hover:scale-110 transform origin-left">
                  Learn more
                  <svg
                    className="ml-1 w-4 h-4 transition-transform duration-300 hover:scale-125"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

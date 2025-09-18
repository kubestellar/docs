"use client";

import { useEffect } from "react";

export default function UseCasesSection() {
  useEffect(() => {
    // Create starfield and grid for Use Cases section
    const createStarfield = (container: HTMLElement) => {
      if (!container) return;
      container.innerHTML = "";

      for (let layer = 1; layer <= 3; layer++) {
        const layerDiv = document.createElement("div");
        layerDiv.className = `star-layer layer-${layer}`;
        layerDiv.style.position = "absolute";
        layerDiv.style.inset = "0";
        layerDiv.style.zIndex = layer.toString();

        const starCount = layer === 1 ? 120 : layer === 2 ? 80 : 50;

        for (let i = 0; i < starCount; i++) {
          const star = document.createElement("div");
          star.style.position = "absolute";
          const size =
            layer === 1
              ? Math.random() * 1.5 + 0.5
              : layer === 2
                ? Math.random() * 1 + 0.5
                : Math.random() * 0.5 + 0.3;
          star.style.width = `${size}px`;
          star.style.height = star.style.width;
          star.style.backgroundColor = "white";
          star.style.borderRadius = "50%";
          star.style.top = `${Math.random() * 100}%`;
          star.style.left = `${Math.random() * 100}%`;
          star.style.opacity = (Math.random() * 0.4 + 0.1).toString();
          star.style.animation = `twinkle ${Math.random() * 3 + 2}s infinite alternate`;
          star.style.animationDelay = `${Math.random() * 2}s`;
          layerDiv.appendChild(star);
        }

        container.appendChild(layerDiv);
      }
    };

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

      for (let i = 0; i < 15; i++) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", "0");
        line.setAttribute("y1", `${i * 6.67}%`);
        line.setAttribute("x2", "100%");
        line.setAttribute("y2", `${i * 6.67}%`);
        line.setAttribute("stroke", "#ffffff");
        line.setAttribute("stroke-width", "0.3");
        line.setAttribute("stroke-opacity", "0.08");
        gridSvg.appendChild(line);
      }

      for (let i = 0; i < 20; i++) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", `${i * 5}%`);
        line.setAttribute("y1", "0");
        line.setAttribute("x2", `${i * 5}%`);
        line.setAttribute("y2", "100%");
        line.setAttribute("stroke", "#ffffff");
        line.setAttribute("stroke-width", "0.3");
        line.setAttribute("stroke-opacity", "0.08");
        gridSvg.appendChild(line);
      }

      container.appendChild(gridSvg);
    };

    const starsContainer = document.getElementById("stars-container-use");
    const gridContainer = document.getElementById("grid-lines-use");

    if (starsContainer) createStarfield(starsContainer);
    if (gridContainer) createGrid(gridContainer);
  }, []);

  const useCases = [
    {
      icon: (
        <svg
          className="w-6 h-6 text-blue-400"
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
      title: "Edge Computing",
      description:
        "Deploy applications across edge locations with centralized management. Ideal for retail, manufacturing, and telecom with distributed infrastructure.",
      borderColor: "bg-blue-500",
      iconBgColor: "bg-blue-400/20",
    },
    {
      icon: (
        <svg
          className="w-6 h-6 text-purple-400"
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
      borderColor: "bg-purple-500",
      iconBgColor: "bg-purple-400/20",
    },
    {
      icon: (
        <svg
          className="w-6 h-6 text-green-400"
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
      title: "Hybrid/Multi-Cloud",
      description:
        "Seamlessly manage workloads across multiple cloud providers and on-premises infrastructure with unified policies and consistent experience.",
      borderColor: "bg-green-500",
      iconBgColor: "bg-green-400/20",
    },
    {
      icon: (
        <svg
          className="w-6 h-6 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      ),
      title: "Disaster Recovery",
      description:
        "Implement robust disaster recovery strategies with automatic workload replication and failover across multiple clusters in different regions.",
      borderColor: "bg-red-500",
      iconBgColor: "bg-red-400/20",
    },
    {
      icon: (
        <svg
          className="w-6 h-6 text-yellow-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      title: "Multi-Tenant Isolation",
      description:
        "Create isolated environments for different teams or customers while maintaining centralized control. Ideal for SaaS providers and large enterprises.",
      borderColor: "bg-yellow-500",
      iconBgColor: "bg-yellow-400/20",
    },
    {
      icon: (
        <svg
          className="w-6 h-6 text-indigo-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: "Performance Optimization",
      description:
        "Deploy workloads closest to users or data sources for optimal performance, reducing latency and improving user experience across global operations.",
      borderColor: "bg-indigo-500",
      iconBgColor: "bg-indigo-400/20",
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
      <div
        id="stars-container-use"
        className="absolute inset-0 overflow-hidden"
      ></div>

      {/* Grid lines background */}
      <div id="grid-lines-use" className="absolute inset-0 opacity-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <h2
            className="text-4xl font-extrabold mb-4"
            style={{ fontSize: "36px" }}
          >
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
              Use Cases
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-white font-normal">
            Discover how organizations leverage KubeStellar for their
            multi-cluster needs.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="group relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700/50 transition-all duration-300 hover:border-gray-600/50 hover:shadow-xl"
              style={{ width: "382px", height: "280px" }}
            >
              {/* Top colored border */}
              <div className={`h-2 ${useCase.borderColor}`}></div>

              <div className="p-6">
                <div className="mb-4">
                  <div
                    className={`${useCase.iconBgColor} rounded-lg flex items-center justify-center mb-3`}
                    style={{ width: "48px", height: "48px" }}
                  >
                    {useCase.icon}
                  </div>
                  <h3
                    className="font-bold text-white mb-2"
                    style={{ fontSize: "17px", lineHeight: "1.3" }}
                  >
                    {useCase.title}
                  </h3>
                </div>

                <p
                  className="text-gray-300 font-normal mb-4"
                  style={{ fontSize: "15px", lineHeight: "1.4" }}
                >
                  {useCase.description}
                </p>

                <button
                  className="text-blue-400 font-medium hover:text-blue-300 transition-colors flex items-center group-hover:translate-x-1 transition-transform duration-200"
                  style={{ fontSize: "14px" }}
                >
                  Learn more
                  <svg
                    className="w-4 h-4 ml-2"
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

import { useEffect } from "react";

const useParallax = (sceneSelector: string, containerSelector: string) => {
  useEffect(() => {
    const sceneContainers = document.querySelectorAll(
      containerSelector
    ) as NodeListOf<HTMLElement>;
    const missionControlScenes = document.querySelectorAll(
      sceneSelector
    ) as NodeListOf<HTMLElement>;

    if (sceneContainers.length > 0 && missionControlScenes.length > 0) {
      missionControlScenes.forEach((missionControlScene, index) => {
        const sceneContainer = sceneContainers[index];

        if (sceneContainer && missionControlScene) {
          setTimeout(() => {
            sceneContainer.style.transform =
              "perspective(1000px) rotateY(3deg) rotateX(2deg) translateZ(0)";
            sceneContainer.style.opacity = "1";
          }, 500);

          const handleMouseMove = (e: MouseEvent) => {
            const rect = missionControlScene.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateY = (x - centerX) / 40;
            const rotateX = (centerY - y) / 40;

            sceneContainer.style.transition = "transform 0.1s ease-out";
            sceneContainer.style.transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateZ(10px)`;
          };

          const handleMouseLeave = () => {
            sceneContainer.style.transition = "transform 0.5s ease-out";
            sceneContainer.style.transform =
              "perspective(1000px) rotateY(3deg) rotateX(2deg) translateZ(0)";
          };

          missionControlScene.addEventListener("mousemove", handleMouseMove);
          missionControlScene.addEventListener("mouseleave", handleMouseLeave);

          const cleanup = () => {
            missionControlScene.removeEventListener(
              "mousemove",
              handleMouseMove
            );
            missionControlScene.removeEventListener(
              "mouseleave",
              handleMouseLeave
            );
          };

          (missionControlScene as any).__cleanup__ = cleanup;
        }
      });

      return () => {
        missionControlScenes.forEach(missionControlScene => {
          if ((missionControlScene as any).__cleanup__) {
            (missionControlScene as any).__cleanup__();
          }
        });
      };
    }
  }, [sceneSelector, containerSelector]);
};

export default useParallax;

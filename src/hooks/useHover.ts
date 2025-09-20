import { useEffect } from "react";

export default function useCardHover(selector: string) {
  useEffect(() => {
    const cards = document.querySelectorAll(selector);

    const handleMouseMove = (card: Element, e: MouseEvent) => {
      const container = card.querySelector<HTMLElement>(".card-3d-container");
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateY = (x - centerX) / 15;
      const rotateX = (centerY - y) / 15;

      if (container) {
        container.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
      }
    };

    const handleMouseLeave = (card: Element) => {
      const container = card.querySelector<HTMLElement>(".card-3d-container");
      if (container) container.style.transform = "rotateY(0deg) rotateX(0deg)";
    };

    cards.forEach(card => {
      card.addEventListener("mousemove", e => handleMouseMove(card, e as MouseEvent));
      card.addEventListener("mouseleave", () => handleMouseLeave(card));
    });

    return () => {
      cards.forEach(card => {
        card.removeEventListener("mousemove", e => handleMouseMove(card, e as MouseEvent));
        card.removeEventListener("mouseleave", () => handleMouseLeave(card));
      });
    };
  }, [selector]);
}

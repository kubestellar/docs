import { useEffect, useRef, useState } from "react";

const useDropdown = () => {
  const [activeDropdown, setActiveDropdown] = useState<HTMLElement | null>(
    null
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const dropdownContainers =
      document.querySelectorAll<HTMLElement>("[data-dropdown]");

    const handleMouseEnter = (container: HTMLElement, menu: HTMLElement) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      dropdownContainers.forEach(otherContainer => {
        if (otherContainer !== container) {
          const otherMenu = otherContainer.querySelector<HTMLElement>(
            "[data-dropdown-menu]"
          );
          if (otherMenu) {
            otherMenu.style.display = "none";
          }
        }
      });

      menu.style.display = "block";
      setActiveDropdown(menu);
    };

    const handleMouseLeave = (menu: HTMLElement) => {
      timeoutRef.current = setTimeout(() => {
        menu.style.display = "none";
        if (activeDropdown === menu) {
          setActiveDropdown(null);
        }
      }, 100);
    };

    const handleMenuMouseEnter = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const handleMenuMouseLeave = (menu: HTMLElement) => {
      menu.style.display = "none";
      if (activeDropdown === menu) {
        setActiveDropdown(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dropdownContainers.forEach(container => {
          const menu = container.querySelector<HTMLElement>(
            "[data-dropdown-menu]"
          );
          if (menu) {
            menu.style.display = "none";
          }
        });
      }
    };

    dropdownContainers.forEach(container => {
      const menu = container.querySelector<HTMLElement>("[data-dropdown-menu]");
      if (menu) {
        container.addEventListener("mouseenter", () =>
          handleMouseEnter(container, menu)
        );
        container.addEventListener("mouseleave", () => handleMouseLeave(menu));
        menu.addEventListener("mouseenter", handleMenuMouseEnter);
        menu.addEventListener("mouseleave", () => handleMenuMouseLeave(menu));
      }
    });

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      dropdownContainers.forEach(container => {
        const menu = container.querySelector<HTMLElement>(
          "[data-dropdown-menu]"
        );
        if (menu) {
          container.removeEventListener("mouseenter", () =>
            handleMouseEnter(container, menu)
          );
          container.removeEventListener("mouseleave", () =>
            handleMouseLeave(menu)
          );
          menu.removeEventListener("mouseenter", handleMenuMouseEnter);
          menu.removeEventListener("mouseleave", () =>
            handleMenuMouseLeave(menu)
          );
        }
      });
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeDropdown]);
};

export default useDropdown;

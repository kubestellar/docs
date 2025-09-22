import { useEffect, useRef } from "react";

function useDropdown<T extends HTMLElement = HTMLElement>(
  dropdownRef?: React.RefObject<T | null>,
  onClose?: () => void
) {
  const activeDropdownRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dropdownContainers = Array.from(
      document.querySelectorAll<HTMLElement>("[data-dropdown]")
    );

    const handlers: Array<{
      container: HTMLElement;
      menu: HTMLElement;
      handleMouseEnter: () => void;
      handleMouseLeave: () => void;
      handleMenuMouseEnter: () => void;
      handleMenuMouseLeave: () => void;
    }> = [];

    dropdownContainers.forEach(container => {
      const menu = container.querySelector<HTMLElement>("[data-dropdown-menu]");
      if (!menu) return;

      const handleMouseEnter = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        dropdownContainers.forEach(other => {
          if (other !== container) {
            const otherMenu = other.querySelector<HTMLElement>("[data-dropdown-menu]");
            if (otherMenu) otherMenu.style.display = "none";
          }
        });
        menu.style.display = "block";
        activeDropdownRef.current = menu;
      };

      const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
          menu.style.display = "none";
          if (activeDropdownRef.current === menu) {
            activeDropdownRef.current = null;
            onCloseRef.current?.();
          }
        }, 100);
      };

      const handleMenuMouseEnter = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      const handleMenuMouseLeave = () => {
        menu.style.display = "none";
        if (activeDropdownRef.current === menu) {
          activeDropdownRef.current = null;
          onCloseRef.current?.();
        }
      };

      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
      menu.addEventListener("mouseenter", handleMenuMouseEnter);
      menu.addEventListener("mouseleave", handleMenuMouseLeave);

      handlers.push({
        container,
        menu,
        handleMouseEnter,
        handleMouseLeave,
        handleMenuMouseEnter,
        handleMenuMouseLeave,
      });
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handlers.forEach(h => (h.menu.style.display = "none"));
        activeDropdownRef.current = null;
        onCloseRef.current?.();
      }
    };

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (dropdownRef?.current && !dropdownRef.current.contains(target)) {
        handlers.forEach(h => (h.menu.style.display = "none"));
        activeDropdownRef.current = null;
        onCloseRef.current?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleDocumentClick);

    return () => {
      handlers.forEach(h => {
        h.container.removeEventListener("mouseenter", h.handleMouseEnter);
        h.container.removeEventListener("mouseleave", h.handleMouseLeave);
        h.menu.removeEventListener("mouseenter", h.handleMenuMouseEnter);
        h.menu.removeEventListener("mouseleave", h.handleMenuMouseLeave);
      });
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleDocumentClick);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [dropdownRef]);

  return { activeDropdownRef };
}

export default useDropdown;

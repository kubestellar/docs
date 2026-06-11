"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface DropdownState {
  isDropdownOpen: boolean;
  isContributeOpen: boolean;
  isCommunityOpen: boolean;
  isGithubOpen: boolean;
}

/**
 * Manages hover-based dropdown menu behavior with timeout-based hide,
 * keyboard escape handling, and language switcher integration.
 */
export function useNavDropdowns() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [isGithubOpen, setIsGithubOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const cleanups: (() => void)[] = [];

    const dropdownContainers =
      document.querySelectorAll<HTMLElement>("[data-dropdown]");

    dropdownContainers.forEach(container => {
      const menu = container.querySelector<HTMLElement>(
        "[data-dropdown-menu]"
      );

      if (!menu) return;

      const clearHideTimeout = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      const showMenu = () => {
        clearHideTimeout();

        // Close all other dropdowns
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

        document.dispatchEvent(new CustomEvent("close-lang-switcher"));

        menu.style.display = "block";
        menu.style.opacity = "1";
        menu.style.visibility = "visible";
        setIsDropdownOpen(true);

        setIsContributeOpen(false);
        setIsCommunityOpen(false);
        setIsGithubOpen(false);

        const dropdownName = container.getAttribute("data-dropdown");
        if (dropdownName === "contribute") {
          setIsContributeOpen(true);
        } else if (dropdownName === "community") {
          setIsCommunityOpen(true);
        } else if (dropdownName === "github") {
          setIsGithubOpen(true);
        }
      };

      const hideMenu = () => {
        timeoutRef.current = setTimeout(() => {
          menu.style.display = "none";
          menu.style.opacity = "0";
          menu.style.visibility = "hidden";
          setIsDropdownOpen(false);
          setIsContributeOpen(false);
          setIsCommunityOpen(false);
          setIsGithubOpen(false);
        }, 300);
      };

      container.addEventListener("mouseenter", showMenu);
      container.addEventListener("mouseleave", hideMenu);
      cleanups.push(() => {
        container.removeEventListener("mouseenter", showMenu);
        container.removeEventListener("mouseleave", hideMenu);
      });

      const button = container.querySelector<HTMLElement>(
        "[data-dropdown-button]"
      );
      if (button) {
        button.addEventListener("mouseenter", clearHideTimeout);
        cleanups.push(() => {
          button.removeEventListener("mouseenter", clearHideTimeout);
        });
      }

      menu.addEventListener("mouseenter", clearHideTimeout);
      menu.addEventListener("mouseleave", hideMenu);
      cleanups.push(() => {
        menu.removeEventListener("mouseenter", clearHideTimeout);
        menu.removeEventListener("mouseleave", hideMenu);
      });
    });

    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dropdownContainers.forEach(container => {
          const menu = container.querySelector(
            "[data-dropdown-menu]"
          ) as HTMLElement;
          if (menu) {
            menu.style.display = "none";
            menu.style.opacity = "0";
            menu.style.visibility = "hidden";
          }
        });

        document.dispatchEvent(new CustomEvent("close-lang-switcher"));

        setIsDropdownOpen(false);
        setIsContributeOpen(false);
        setIsCommunityOpen(false);
        setIsGithubOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    cleanups.push(() => document.removeEventListener("keydown", handleEscape));

    // Language switcher integration
    const langSwitcher = document.querySelector<HTMLElement>(
      ".language-switcher-container"
    );

    if (langSwitcher) {
      let isLangHovered = false;
      let langDropdownElement: HTMLElement | null = null;

      const handleMouseEnter = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        dropdownContainers.forEach(container => {
          const menu = container.querySelector<HTMLElement>(
            "[data-dropdown-menu]"
          );
          if (menu) {
            menu.style.display = "none";
          }
        });

        const langButton = langSwitcher.querySelector("button");
        if (langButton) {
          const dropdown = document.querySelector('[role="listbox"]');
          const isDropdownVisible =
            dropdown && window.getComputedStyle(dropdown).display !== "none";

          if (!isDropdownVisible) {
            isLangHovered = true;
            langButton.click();
            setIsDropdownOpen(true);
          } else {
            isLangHovered = true;
          }
        }
      };

      const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
          const langButton = langSwitcher.querySelector("button");
          const dropdown = document.querySelector('[role="listbox"]');
          const isDropdownVisible =
            dropdown && window.getComputedStyle(dropdown).display !== "none";

          if (langButton && isLangHovered && isDropdownVisible) {
            isLangHovered = false;
            langButton.click();
            setIsDropdownOpen(false);
          } else if (!isDropdownVisible) {
            isLangHovered = false;
            setIsDropdownOpen(false);
          }
        }, 300);
      };

      const closeLangSwitcher = () => {
        const langButton = langSwitcher.querySelector("button");
        const dropdown = document.querySelector('[role="listbox"]');
        const isDropdownVisible =
          dropdown && window.getComputedStyle(dropdown).display !== "none";

        if (langButton && isDropdownVisible) {
          isLangHovered = false;
          langButton.click();
          setIsDropdownOpen(false);
        } else if (isLangHovered) {
          isLangHovered = false;
          setIsDropdownOpen(false);
        }
      };

      document.addEventListener("close-lang-switcher", closeLangSwitcher);
      langSwitcher.addEventListener("mouseenter", handleMouseEnter);
      langSwitcher.addEventListener("mouseleave", handleMouseLeave);
      cleanups.push(() => {
        langSwitcher.removeEventListener("mouseenter", handleMouseEnter);
        langSwitcher.removeEventListener("mouseleave", handleMouseLeave);
        document.removeEventListener("close-lang-switcher", closeLangSwitcher);
      });

      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              const dropdown =
                (element.querySelector?.('[role="listbox"]') as HTMLElement) ||
                (element.getAttribute?.("role") === "listbox"
                  ? (element as HTMLElement)
                  : null);

              if (dropdown) {
                langDropdownElement = dropdown;
                dropdown.addEventListener("mouseenter", () => {
                  if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                  }
                });
                dropdown.addEventListener("mouseleave", () => {
                  handleMouseLeave();
                });
              }
            }
          });

          mutation.removedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              if (
                element === langDropdownElement ||
                element.contains?.(langDropdownElement)
              ) {
                langDropdownElement = null;
                if (isLangHovered) {
                  isLangHovered = false;
                  setIsDropdownOpen(false);
                }
              }
            }
          });
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
      cleanups.push(() => observer.disconnect());
    }

    return () => {
      cleanups.forEach(cleanup => cleanup());
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    isDropdownOpen,
    isContributeOpen,
    isCommunityOpen,
    isGithubOpen,
  };
}

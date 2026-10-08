"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/** Every hover-driven menu in the desktop navbar. */
export type NavDropdownName = "contribute" | "community" | "github" | "lang";

/** At most one navbar dropdown is open at a time; `null` means none. */
export type OpenDropdown = NavDropdownName | null;

/** Delay between the pointer leaving a dropdown and the menu closing. */
export const DROPDOWN_CLOSE_DELAY_MS = 300;

export interface NavDropdownControls {
  /** The single dropdown currently open, or `null`. */
  openDropdown: OpenDropdown;
  /** `true` when any dropdown (including the language switcher) is open. */
  isDropdownOpen: boolean;
  /** Open `name` immediately, closing whichever dropdown was open before. */
  openMenu: (name: NavDropdownName) => void;
  /** Close `name` immediately if it is the open dropdown; otherwise no-op. */
  closeMenu: (name: NavDropdownName) => void;
  /** Close `name` after {@link DROPDOWN_CLOSE_DELAY_MS} unless cancelled. */
  scheduleClose: (name: NavDropdownName) => void;
  /** Cancel a pending {@link scheduleClose}. */
  cancelClose: () => void;
  /** Close whatever is open, immediately. */
  closeAll: () => void;
}

/**
 * Owns the "which navbar dropdown is open" state as a single discriminated
 * value. Visibility, `aria-expanded`, and the blur overlay all derive from
 * `openDropdown`, so they cannot disagree. Children wire `openMenu` /
 * `scheduleClose` to their own `onMouseEnter` / `onMouseLeave`; the hook
 * itself only touches the document for the global Escape key.
 */
export function useNavDropdowns(): NavDropdownControls {
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const openMenu = useCallback(
    (name: NavDropdownName) => {
      cancelClose();
      setOpenDropdown(name);
    },
    [cancelClose]
  );

  const closeMenu = useCallback((name: NavDropdownName) => {
    setOpenDropdown(current => (current === name ? null : current));
  }, []);

  const scheduleClose = useCallback(
    (name: NavDropdownName) => {
      cancelClose();
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        closeMenu(name);
      }, DROPDOWN_CLOSE_DELAY_MS);
    },
    [cancelClose, closeMenu]
  );

  const closeAll = useCallback(() => {
    cancelClose();
    setOpenDropdown(null);
  }, [cancelClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      cancelClose();
    };
  }, [closeAll, cancelClose]);

  return {
    openDropdown,
    isDropdownOpen: openDropdown !== null,
    openMenu,
    closeMenu,
    scheduleClose,
    cancelClose,
    closeAll,
  };
}

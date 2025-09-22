"use client";

import { useState, useRef, useCallback } from "react";
import { useDropdown } from "../index";

interface SelectDropdownProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  widthClass?: string; // e.g. "w-64", "w-72", "w-full"
  widthPx?: number; // e.g. 280
}

export default function SelectDropdown({
  id,
  name,
  value,
  onChange,
  options,
  required,
  widthClass,
  widthPx,
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => setIsOpen(false), []);
  useDropdown(dropdownRef, handleClose);

  const handleSelect = (selectedValue: string) => {
    const event = {
      target: { name, value: selectedValue },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange(event);
    setIsOpen(false);
  };

  const widthStyle = widthPx ? { width: `${widthPx}px` } : undefined;
  const rootClass = `relative ${widthClass ?? ""}`.trim();

  return (
    <div className={rootClass} ref={dropdownRef} data-dropdown style={widthStyle}>
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className={`px-4 py-3 pr-12 bg-gray-700/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer hover:border-gray-500/60 hover:bg-gray-700/70 flex justify-between items-center w-full`}
        style={widthStyle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span
          className="truncate block text-left w-full"
          title={options.find(o => o.value === value)?.label || "Select a subject"}
        >
          {options.find(option => option.value === value)?.label || "Select a subject"}
        </span>

        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className="absolute left-0 mt-2 w-full bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl py-2 ring-1 ring-gray-700/50 transition-all duration-200 z-50"
        data-dropdown-menu
        style={{
          display: isOpen ? "block" : "none",
          width: widthPx ? `${widthPx}px` : undefined,
        }}
      >
        {options.map(option => (
          <a
            key={option.value}
            href="#"
            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-blue-900/30 rounded transition-all duration-200 hover:text-blue-300 hover:shadow-md whitespace-nowrap"
            onClick={(e) => {
              e.preventDefault();
              handleSelect(option.value);
            }}
            title={option.label}
          >
            {option.label}
          </a>
        ))}
      </div>
    </div>
  );
}

/** Shared class-name builders for the docs navbar dropdowns, driven by theme. */
export function getNavClasses(isDark: boolean) {
  const buttonClasses = `text-sm transition-colors px-2 py-1.5 rounded-md flex items-center gap-1.5 ${
    isDark
      ? "text-gray-300 hover:text-gray-100 hover:bg-neutral-800"
      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
  }`;

  const dropdownClasses = `absolute left-0 top-full mt-0.5 w-52 rounded-md shadow-xl py-1 border z-50 ${
    isDark
      ? "bg-neutral-900 border-neutral-800"
      : "bg-white border-gray-200"
  }`;

  const dropdownItemClasses = `flex items-center px-3 py-2 text-sm transition-colors ${
    isDark
      ? "text-gray-300 hover:bg-neutral-800"
      : "text-gray-700 hover:bg-gray-100"
  }`;

  return { buttonClasses, dropdownClasses, dropdownItemClasses };
}

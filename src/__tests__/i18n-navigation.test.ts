import { describe, expect, it, vi } from "vitest";

// Verifies src/i18n/navigation.ts wires createNavigation with the settings
// module's locale list and 'always' prefix. The file is otherwise 0% covered
// because it is imported only by Next.js route handlers at runtime; a
// silent regression here would break every locale-prefixed link across the
// docs site.

const createNavigationMock = vi.fn(() => ({
  Link: "Link",
  redirect: "redirect",
  usePathname: "usePathname",
  useRouter: "useRouter",
}));

vi.mock("next-intl/navigation", () => ({
  createNavigation: createNavigationMock,
}));

describe("i18n navigation module", () => {
  it("configures createNavigation with the settings locales and 'always' prefix", async () => {
    const { locales } = await import("../i18n/settings");
    const nav = await import("../i18n/navigation");

    expect(createNavigationMock).toHaveBeenCalledTimes(1);
    expect(createNavigationMock).toHaveBeenCalledWith({
      locales,
      localePrefix: "always",
    });

    expect(nav.Link).toBe("Link");
    expect(nav.redirect).toBe("redirect");
    expect(nav.usePathname).toBe("usePathname");
    expect(nav.useRouter).toBe("useRouter");
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import React from "react";
import GithubDropdown from "../components/docs/navbar/GithubDropdown";

/**
 * Coverage for src/components/docs/navbar/GithubDropdown.tsx (baseline: 75% lines
 * / 18.2% branches / 50% functions on 2026-09-27). The four external anchors
 * (star / fork / watch / issues) and both isDark themes only render when
 * openDropdown === "github", so the light/dark × open/closed matrix drives the
 * remaining branches. Also exercises the mouse-event callbacks passed by the
 * navbar host so future refactors that drop a handler will trip the test.
 */

const stats = { stars: "1.2k", forks: "345", watchers: "67" };

const noop = () => {};

afterEach(() => cleanup());

describe("GithubDropdown", () => {
  it("renders the collapsed trigger without the dropdown panel when closed", () => {
    const { container, queryByText } = render(
      <GithubDropdown
        isDark={false}
        openDropdown={null}
        githubStats={stats}
        onMouseEnter={noop}
        onMouseLeave={noop}
        onDropdownMouseEnter={noop}
      />
    );

    const trigger = container.querySelector('[aria-label="GitHub"]');
    expect(trigger).not.toBeNull();
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
    // Panel-only anchors and stat labels must be absent while closed.
    expect(queryByText("Star")).toBeNull();
    expect(queryByText("Fork")).toBeNull();
    expect(queryByText("Watch")).toBeNull();
    expect(queryByText("Create Issue")).toBeNull();
    expect(queryByText("1.2k")).toBeNull();
    // Chevron does not carry the rotated modifier while closed.
    const chevron = container.querySelector(
      "svg.transition-transform"
    ) as SVGElement;
    expect(chevron.classList.contains("rotate-180")).toBe(false);
  });

  it('renders the full stats panel and rotates the chevron when openDropdown === "github"', () => {
    const { container, getByText } = render(
      <GithubDropdown
        isDark={false}
        openDropdown="github"
        githubStats={stats}
        onMouseEnter={noop}
        onMouseLeave={noop}
        onDropdownMouseEnter={noop}
      />
    );

    const trigger = container.querySelector('[aria-label="GitHub"]');
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");

    // All four labels are present with their stat values (issues link has no value).
    expect(getByText("Star").textContent).toBe("Star");
    expect(getByText("Fork").textContent).toBe("Fork");
    expect(getByText("Watch").textContent).toBe("Watch");
    expect(getByText("Create Issue").textContent).toBe("Create Issue");
    expect(getByText("1.2k").textContent).toBe("1.2k");
    expect(getByText("345").textContent).toBe("345");
    expect(getByText("67").textContent).toBe("67");

    // Chevron carries rotate-180 while open.
    const chevron = container.querySelector(
      "svg.transition-transform"
    ) as SVGElement;
    expect(chevron.classList.contains("rotate-180")).toBe(true);

    // Panel anchors point at the documented kubestellar/docs endpoints
    // (guards against a rename regressing every external link at once).
    const anchors = Array.from(container.querySelectorAll("a")).map(
      a => a.getAttribute("href") ?? ""
    );
    expect(anchors).toContain("https://github.com/kubestellar/docs");
    expect(anchors).toContain("https://github.com/kubestellar/docs/fork");
    expect(anchors).toContain("https://github.com/kubestellar/docs/watchers");
    expect(anchors).toContain("https://github.com/kubestellar/docs/issues");

    // Every external anchor must open in a new tab with a noopener-noreferrer
    // rel — the aria-label trigger anchor and each panel link are all remote.
    for (const a of container.querySelectorAll("a")) {
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it("applies the dark-mode class variants when isDark is true and open", () => {
    const { container } = render(
      <GithubDropdown
        isDark={true}
        openDropdown="github"
        githubStats={stats}
        onMouseEnter={noop}
        onMouseLeave={noop}
        onDropdownMouseEnter={noop}
      />
    );

    const trigger = container.querySelector(
      '[aria-label="GitHub"]'
    ) as HTMLElement;
    // Dark-mode trigger uses text-gray-300 / hover:bg-neutral-800.
    expect(trigger.className).toContain("text-gray-300");
    expect(trigger.className).toContain("hover:bg-neutral-800");
    // Light-mode class must NOT leak into the trigger's className string.
    expect(trigger.className).not.toContain("text-gray-700");

    // Panel wrapper uses bg-neutral-900 in dark mode.
    const panel = container.querySelector(
      ".absolute.right-0.top-full"
    ) as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.className).toContain("bg-neutral-900");
    expect(panel.className).toContain("border-neutral-800");
    expect(panel.className).not.toContain("bg-white");

    // Stat pills switch to bg-neutral-800 in dark mode.
    const pills = Array.from(container.querySelectorAll(".text-xs.px-1\\.5"));
    expect(pills.length).toBeGreaterThan(0);
    for (const p of pills) {
      expect((p as HTMLElement).className).toContain("bg-neutral-800");
    }
  });

  it("applies the light-mode class variants when isDark is false and open", () => {
    const { container } = render(
      <GithubDropdown
        isDark={false}
        openDropdown="github"
        githubStats={stats}
        onMouseEnter={noop}
        onMouseLeave={noop}
        onDropdownMouseEnter={noop}
      />
    );

    const trigger = container.querySelector(
      '[aria-label="GitHub"]'
    ) as HTMLElement;
    expect(trigger.className).toContain("text-gray-700");
    expect(trigger.className).toContain("hover:bg-gray-100");
    expect(trigger.className).not.toContain("text-gray-300");

    const panel = container.querySelector(
      ".absolute.right-0.top-full"
    ) as HTMLElement;
    expect(panel.className).toContain("bg-white");
    expect(panel.className).toContain("border-gray-200");
    expect(panel.className).not.toContain("bg-neutral-900");
  });

  it("does not render the panel when openDropdown is set to a non-github value", () => {
    // Guard the openDropdown === "github" equality: any other DropdownType
    // ("contribute", "community", "language") must leave the panel hidden.
    const { queryByText, container } = render(
      <GithubDropdown
        isDark={false}
        openDropdown="community"
        githubStats={stats}
        onMouseEnter={noop}
        onMouseLeave={noop}
        onDropdownMouseEnter={noop}
      />
    );
    expect(queryByText("Star")).toBeNull();
    const trigger = container.querySelector('[aria-label="GitHub"]');
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
  });

  it("invokes the hover callbacks on the wrapper and dropdown-mouseenter on the trigger", () => {
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();
    const onDropdownMouseEnter = vi.fn();

    const { container } = render(
      <GithubDropdown
        isDark={false}
        openDropdown="github"
        githubStats={stats}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onDropdownMouseEnter={onDropdownMouseEnter}
      />
    );

    // The outer wrapper carries onMouseEnter / onMouseLeave; the trigger and
    // panel carry onDropdownMouseEnter — fire synthetic events through the
    // Testing Library helper so React routes them to the handlers.
    const wrapper = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    fireEvent.mouseLeave(wrapper);
    expect(onMouseEnter).toHaveBeenCalledTimes(1);
    expect(onMouseLeave).toHaveBeenCalledTimes(1);

    const trigger = container.querySelector(
      '[aria-label="GitHub"]'
    ) as HTMLElement;
    fireEvent.mouseEnter(trigger);
    expect(onDropdownMouseEnter).toHaveBeenCalledTimes(1);

    const panel = container.querySelector(
      ".absolute.right-0.top-full"
    ) as HTMLElement;
    fireEvent.mouseEnter(panel);
    expect(onDropdownMouseEnter).toHaveBeenCalledTimes(2);
    fireEvent.mouseLeave(panel);
    // panel's onMouseLeave is the same handler as the wrapper's; React may
    // also route the panel-leave through the wrapper listener, so any
    // additional call beyond the wrapper-leave counts as coverage of the
    // panel-leave wiring.
    expect(onMouseLeave.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("stops click propagation on the trigger anchor so wrapper handlers do not fire twice", () => {
    // The inline onClick={(e) => e.stopPropagation()} on the trigger anchor
    // exists so clicking the GitHub icon opens the repo without also closing
    // any surrounding hover dropdown. Verify propagation actually stops.
    const wrapperClick = vi.fn();
    const { container } = render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div onClick={wrapperClick}>
        <GithubDropdown
          isDark={false}
          openDropdown="github"
          githubStats={stats}
          onMouseEnter={noop}
          onMouseLeave={noop}
          onDropdownMouseEnter={noop}
        />
      </div>
    );

    const triggerAnchor = container.querySelector(
      '[aria-label="GitHub"] a[href="https://github.com/kubestellar/docs"]'
    ) as HTMLElement;
    expect(triggerAnchor).not.toBeNull();
    fireEvent.click(triggerAnchor);
    expect(wrapperClick).not.toHaveBeenCalled();
  });
});

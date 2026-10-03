import { describe, it, expect } from "vitest";
import { nextSortState } from "../lib/sortToggle";

describe("nextSortState", () => {
  it("flips direction when clicking the currently active column", () => {
    expect(nextSortState("points", "desc", "points")).toEqual({ field: "points", dir: "asc" });
    expect(nextSortState("points", "asc", "points")).toEqual({ field: "points", dir: "desc" });
  });

  it("selects a new column with the default direction ('desc' unless overridden)", () => {
    expect(nextSortState("points", "asc", "activity")).toEqual({ field: "activity", dir: "desc" });
  });

  it("honors a custom defaultDir when selecting a new column", () => {
    expect(nextSortState("level", "desc", "name", "asc")).toEqual({ field: "name", dir: "asc" });
  });

  it("still flips direction on the active column even with a defaultDir argument", () => {
    expect(nextSortState("name", "asc", "name", "asc")).toEqual({ field: "name", dir: "desc" });
  });
});

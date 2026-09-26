/**
 * Unit tests for scripts/lib/text-clustering.mjs — the pure text/NLP and
 * TF-IDF/clustering helpers extracted from
 * scripts/generate-contributor-profiles.mjs. Everything here is exercised
 * without hitting the GitHub API or disk.
 */
import { describe, it, expect } from "vitest";
import {
  cleanText,
  tokenize,
  computeTfIdf,
  cosineSimilarity,
  centroid,
  agglomerativeClustering,
  nameCluster,
} from "./text-clustering.mjs";

describe("cleanText", () => {
  it("returns an empty string for falsy input", () => {
    expect(cleanText("")).toBe("");
    expect(cleanText(null)).toBe("");
    expect(cleanText(undefined)).toBe("");
  });

  it("strips code blocks, inline code, URLs, and HTML tags", () => {
    const input =
      "See ```const x = 1;``` and `inline` at https://example.com/path <b>bold</b>";
    expect(cleanText(input)).toBe("See and at bold");
  });

  it("collapses markdown punctuation and whitespace", () => {
    expect(cleanText("# Title\n\n- item one\n- item two")).toBe(
      "Title item one item two"
    );
  });
});

describe("tokenize", () => {
  it("returns an empty array for empty or whitespace-only text", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("   ")).toEqual([]);
  });

  it("lowercases, lemmatizes, and drops stop words/punctuation/numbers", () => {
    const tokens = tokenize("The clusters are running quickly, 123 times.");
    expect(tokens).not.toContain("the");
    expect(tokens).not.toContain("123");
    expect(tokens).not.toContain(",");
    expect(tokens).toContain("cluster");
    expect(tokens).toContain("run");
  });
});

describe("computeTfIdf", () => {
  it("returns empty vectors and vocabulary for no documents", () => {
    const { vectors, vocabulary } = computeTfIdf([]);
    expect(vectors).toEqual([]);
    expect(vocabulary.size).toBe(0);
  });

  it("assigns higher weight to terms unique to fewer documents", () => {
    const { vectors, vocabulary } = computeTfIdf([
      ["gpu", "benchmark"],
      ["gpu", "cluster"],
      ["gpu", "cluster"],
    ]);
    expect(vocabulary.has("gpu")).toBe(true);
    // "benchmark" appears in only 1/3 docs, "gpu" in 3/3 — benchmark should
    // score higher in doc 0 than the ubiquitous "gpu" term.
    expect(vectors[0].get("benchmark")).toBeGreaterThan(
      vectors[0].get("gpu") ?? 0
    );
  });
});

describe("cosineSimilarity", () => {
  it("returns 0 for vectors with no overlapping terms", () => {
    const a = new Map([["x", 1]]);
    const b = new Map([["y", 1]]);
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it("returns 1 for identical vectors", () => {
    const a = new Map([["x", 2], ["y", 3]]);
    expect(cosineSimilarity(a, a)).toBeCloseTo(1);
  });

  it("returns 0 when either vector is empty (zero norm)", () => {
    const a = new Map([["x", 1]]);
    const empty = new Map();
    expect(cosineSimilarity(a, empty)).toBe(0);
  });
});

describe("centroid", () => {
  it("averages term scores across vectors", () => {
    const result = centroid([
      new Map([["x", 2]]),
      new Map([["x", 4]]),
    ]);
    expect(result.get("x")).toBe(3);
  });

  it("returns an empty map for an empty vector list", () => {
    expect(centroid([]).size).toBe(0);
  });
});

describe("agglomerativeClustering", () => {
  it("returns an empty array for no vectors", () => {
    expect(agglomerativeClustering([])).toEqual([]);
  });

  it("puts a single vector in its own cluster", () => {
    expect(agglomerativeClustering([new Map([["x", 1]])])).toEqual([[0]]);
  });

  it("merges near-identical vectors and keeps dissimilar ones separate", () => {
    const vectors = [
      new Map([["gpu", 1], ["benchmark", 1]]),
      new Map([["gpu", 1], ["benchmark", 1]]),
      new Map([["docs", 1], ["typo", 1]]),
    ];
    const clusters = agglomerativeClustering(vectors)
      .map((c) => [...c].sort())
      .sort((a, b) => a.length - b.length);
    expect(clusters).toEqual([[2], [0, 1]]);
  });
});

describe("nameCluster", () => {
  it("names a cluster using its top-scoring terms, most significant first", () => {
    const c = new Map([
      ["low", 0.1],
      ["high", 0.9],
      ["mid", 0.5],
      ["extra", 0.05],
    ]);
    expect(nameCluster(c)).toBe("high, mid, low");
  });
});

/**
 * Pure text preprocessing, TF-IDF, and agglomerative clustering helpers
 * extracted from scripts/generate-contributor-profiles.mjs. Everything here
 * is a pure function of its inputs (no network, no disk I/O) so it can be
 * unit-tested in isolation — see scripts/lib/text-clustering.test.mjs.
 */

import { createRequire } from "node:module";

// wink-nlp is CJS-only, use createRequire for ESM compat
const require = createRequire(import.meta.url);
const winkNLP = require("wink-nlp");
const model = require("wink-eng-lite-web-model");
const nlp = winkNLP(model);
const its = nlp.its;

/** Minimum cosine similarity to merge two clusters */
export const CLUSTER_MERGE_THRESHOLD = 0.15;
/** Number of top terms used to name a cluster */
export const CLUSTER_NAME_TERM_COUNT = 3;

// ── Text preprocessing ───────────────────────────────────────────────

/** Strip markdown formatting, code blocks, URLs, and HTML tags */
export function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/```[\s\S]*?```/g, " ") // code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/https?:\/\/\S+/g, " ") // URLs
    .replace(/<[^>]+>/g, " ") // HTML tags
    .replace(/[#*_~\[\]()>|\\-]/g, " ") // markdown chars
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokenize text into lemmatized, lowercase tokens (no stop words, no punctuation) */
export function tokenize(text) {
  if (!text || text.trim().length === 0) return [];
  const doc = nlp.readDoc(text);
  const tokens = [];
  doc.tokens().each((t) => {
    if (t.out(its.stopWordFlag)) return;
    if (t.out(its.type) === "punctuation") return;
    const lemma = t.out(its.lemma);
    if (!lemma) return;
    const lower = lemma.toLowerCase();
    if (lower.length < 2) return;
    // Skip pure numbers
    if (/^\d+$/.test(lower)) return;
    tokens.push(lower);
  });
  return tokens;
}

// ── TF-IDF ───────────────────────────────────────────────────────────

/**
 * Compute TF-IDF vectors for a set of documents.
 * @param {string[][]} docs - Array of tokenized documents (each is an array of terms)
 * @returns {{ vectors: Map<string, number>[], vocabulary: Set<string> }}
 */
export function computeTfIdf(docs) {
  const docCount = docs.length;
  if (docCount === 0) return { vectors: [], vocabulary: new Set() };

  // Document frequency: how many docs contain each term
  const df = new Map();
  for (const tokens of docs) {
    const unique = new Set(tokens);
    for (const term of unique) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }

  const vocabulary = new Set(df.keys());

  // Compute TF-IDF vector per document
  const vectors = docs.map((tokens) => {
    const tf = new Map();
    for (const t of tokens) {
      tf.set(t, (tf.get(t) || 0) + 1);
    }
    const len = tokens.length || 1;
    const vec = new Map();
    for (const [term, count] of tf) {
      const tfNorm = count / len;
      const idf = Math.log(docCount / (df.get(term) || 1));
      const score = tfNorm * idf;
      if (score > 0) vec.set(term, score);
    }
    return vec;
  });

  return { vectors, vocabulary };
}

/** Cosine similarity between two sparse TF-IDF vectors (Map<string, number>) */
export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [term, val] of a) {
    normA += val * val;
    if (b.has(term)) dot += val * b.get(term);
  }
  for (const [, val] of b) {
    normB += val * val;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Compute centroid of multiple TF-IDF vectors */
export function centroid(vectors) {
  const sum = new Map();
  for (const vec of vectors) {
    for (const [term, val] of vec) {
      sum.set(term, (sum.get(term) || 0) + val);
    }
  }
  const count = vectors.length || 1;
  const result = new Map();
  for (const [term, val] of sum) {
    result.set(term, val / count);
  }
  return result;
}

// ── Agglomerative clustering ─────────────────────────────────────────

/**
 * Cluster TF-IDF vectors using agglomerative (bottom-up) clustering.
 * Each issue starts as its own cluster. Merge the two most similar clusters
 * until the maximum similarity drops below CLUSTER_MERGE_THRESHOLD.
 *
 * @param {Map<string, number>[]} vectors - TF-IDF vectors (one per issue)
 * @returns {number[][]} - Array of clusters, each is an array of issue indices
 */
export function agglomerativeClustering(vectors) {
  if (vectors.length === 0) return [];
  if (vectors.length === 1) return [[0]];

  // Initialize: each issue is its own cluster
  let clusters = vectors.map((_, i) => [i]);
  let clusterCentroids = vectors.map((v) => new Map(v));

  while (clusters.length > 1) {
    // Find the two most similar clusters
    let bestSim = -1;
    let bestI = -1;
    let bestJ = -1;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const sim = cosineSimilarity(clusterCentroids[i], clusterCentroids[j]);
        if (sim > bestSim) {
          bestSim = sim;
          bestI = i;
          bestJ = j;
        }
      }
    }

    // Stop if the most similar pair is below threshold
    if (bestSim < CLUSTER_MERGE_THRESHOLD) break;

    // Merge cluster j into cluster i
    const mergedIndices = [...clusters[bestI], ...clusters[bestJ]];
    const mergedVectors = mergedIndices.map((idx) => vectors[idx]);
    const mergedCentroid = centroid(mergedVectors);

    clusters[bestI] = mergedIndices;
    clusterCentroids[bestI] = mergedCentroid;

    // Remove cluster j
    clusters.splice(bestJ, 1);
    clusterCentroids.splice(bestJ, 1);
  }

  return clusters;
}

/**
 * Name a cluster by its top N terms (by average TF-IDF score).
 * @param {Map<string, number>} clusterCentroid
 * @returns {string} e.g. "benchmark, latency, performance"
 */
export function nameCluster(clusterCentroid) {
  const sorted = [...clusterCentroid.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, CLUSTER_NAME_TERM_COUNT);
  return sorted.map(([term]) => term).join(", ");
}

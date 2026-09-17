/**
 * Paginated GitHub REST fetch helpers for the leaderboard generator.
 *
 * Wraps the low-level `ghFetch`/`delay` primitives from ./github-fetch.mjs
 * with the leaderboard's page-walking and date-chunking strategy (GitHub's
 * REST search endpoints cap out around ~100 pages per query, so long date
 * ranges are split into CHUNK_DAYS-sized windows and fetched sequentially).
 */

import { API_BASE, REST_PER_PAGE, REST_PAGE_DELAY_MS, ghFetch, delay } from "./github-fetch.mjs";

const MAX_PAGES_PER_QUERY = 95;
const CHUNK_DAYS = 30;

export async function fetchPagedItems(repo, sinceDate, untilDate, headers) {
  const allItems = [];

  for (let page = 1; page <= MAX_PAGES_PER_QUERY; page++) {
    const url = `${API_BASE}/repos/${repo}/issues?state=all&per_page=${REST_PER_PAGE}&page=${page}&sort=created&direction=asc&since=${sinceDate}`;

    if (page > 1) await delay(REST_PAGE_DELAY_MS);

    let items;
    try {
      items = await ghFetch(url, headers);
    } catch (err) {
      if (err.message.includes("422")) {
        console.warn(`    Page ${page} hit GitHub pagination limit for ${repo}, returning ${allItems.length} items collected so far.`);
        break;
      }
      throw err;
    }

    for (const item of items) {
      if (untilDate && item.created_at >= untilDate) continue;
      allItems.push(item);
    }

    if (items.length < REST_PER_PAGE) break;
  }

  return allItems;
}

export async function fetchItemsSince(repo, sinceDate, headers) {
  const since = new Date(sinceDate);
  const now = new Date();
  const totalDays = Math.ceil((now - since) / (86400 * 1000));

  if (totalDays <= CHUNK_DAYS) {
    return fetchPagedItems(repo, sinceDate, null);
  }

  const allItems = [];
  let chunkStart = new Date(since);

  while (chunkStart < now) {
    const chunkEnd = new Date(chunkStart);
    chunkEnd.setUTCDate(chunkEnd.getUTCDate() + CHUNK_DAYS);
    const untilISO = chunkEnd < now ? chunkEnd.toISOString() : null;

    const items = await fetchPagedItems(repo, chunkStart.toISOString(), untilISO, headers);
    allItems.push(...items);

    if (items.length > 0) {
      console.log(`    ${repo} chunk ${chunkStart.toISOString().slice(0, 10)}..${(untilISO || now.toISOString()).slice(0, 10)}: ${items.length} items`);
    }

    chunkStart = chunkEnd;
  }

  return allItems;
}

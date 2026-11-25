import { test, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import { fetchLinkedPages } from "./github-fetch.mjs";

afterEach(() => mock.restoreAll());

test("follows cursor links even when a page is short", async () => {
  const urls = [];
  mock.method(globalThis, "fetch", async (url) => {
    urls.push(url);
    return url === "https://api.github.com/first"
      ? new Response(JSON.stringify([{ id: 1 }]), { headers: { link: '<https://api.github.com/next?after=abc&page=2>; rel="next"' } })
      : new Response(JSON.stringify([{ id: 2 }]));
  });
  const result = await fetchLinkedPages("https://api.github.com/first", {}, { delayMs: 0 });
  assert.deepEqual(result, [{ id: 1 }, { id: 2 }]);
  assert.deepEqual(urls, ["https://api.github.com/first", "https://api.github.com/next?after=abc&page=2"]);
});

test("rejects the whole fetch when a later page fails", async () => {
  mock.method(globalThis, "fetch", async (url) => url.endsWith("first")
    ? new Response("[]", { headers: { link: '<https://api.github.com/second>; rel="next"' } })
    : new Response("rate limit", { status: 403 }));
  await assert.rejects(fetchLinkedPages("https://api.github.com/first", {}, { delayMs: 0 }), /GitHub API 403/);
});

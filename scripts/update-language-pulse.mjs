import { readFile, writeFile } from "node:fs/promises";

const seeds = JSON.parse(await readFile(new URL("../public/language-pulse-seeds.json", import.meta.url), "utf8"));
const now = new Date();
const since = new Date(now.getTime() - 30 * 864e5).toISOString().slice(0, 10);
const languageFor = (locale) => locale.split("-")[0];

async function observe(term, locale) {
  const url = new URL("https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts");
  url.searchParams.set("q", `"${term}" lang:${languageFor(locale)} since:${since}`);
  url.searchParams.set("limit", "25");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Bluesky ${response.status}`);
    const data = await response.json();
    const posts = Array.isArray(data.posts) ? data.posts : [];
    return {
      observedCount: posts.length,
      latestObservedAt: posts.map((post) => post?.record?.createdAt).filter(Boolean).sort().at(-1) || null,
      observationSource: "Bluesky public search",
      observationUrl: "https://bsky.social/about/blog/05-31-2024-search",
    };
  } finally {
    clearTimeout(timeout);
  }
}

const locales = {};
for (const [locale, items] of Object.entries(seeds)) {
  const enriched = await Promise.all(items.map(async (item) => {
    try {
      return { ...item, ...(await observe(item.term, locale)) };
    } catch {
      return { ...item, observedCount: 0, latestObservedAt: null, observationSource: "monitor unavailable" };
    }
  }));
  locales[locale] = {
    live: enriched.some((item) => item.observedCount > 0),
    source: "Dated dictionary baseline + Bluesky public-post occurrence monitor",
    updatedAt: now.toISOString(),
    caveat: "Occurrence supports current recognition, not universal popularity. Region, relationship, channel, and safety labels still govern use.",
    items: enriched,
  };
}

await writeFile(
  new URL("../public/language-pulse.json", import.meta.url),
  `${JSON.stringify({ generatedAt: now.toISOString(), locales }, null, 2)}\n`,
);

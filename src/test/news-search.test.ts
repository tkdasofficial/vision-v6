import { describe, it, expect } from "vitest";
import { parseNewsRss } from "@/lib/search/search.server";
import { asksForSources } from "@/lib/ai/request-route";

describe("news search", () => {
  it("parses dated news items", () => {
    const xml = `<rss><channel><item><title>Musk news - Reuters</title><link>https://news.google.com/a</link><pubDate>Wed, 14 Oct 2026 10:00:00 GMT</pubDate><source url="x">Reuters</source></item></channel></rss>`;
    const [r] = parseNewsRss(xml);
    expect(r.url).toBe("https://news.google.com/a");
    expect(r.source).toBe("News — Reuters, 2026-10-14");
  });
  it("asking for web search or latest updates triggers a search", () => {
    expect(asksForSources("Use web search to get latest updates about Elon Musk")).toBe(true);
    expect(asksForSources("updates about Tesla")).toBe(true);
    expect(asksForSources("write a poem")).toBe(false);
  });
});

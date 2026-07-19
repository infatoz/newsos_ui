import { buildLlmsFullTxt, buildLlmsTxt, formatLlmsArticleLink } from "../llms-txt";
import type { Post } from "@/types";

describe("llms.txt builders", () => {
  const post = {
    id: "1",
    databaseId: 1,
    title: "Cabinet clears infrastructure push",
    slug: "cabinet-clears-infrastructure-push",
    uri: "/india/cabinet-clears-infrastructure-push/",
    excerpt: "<p>A multi-year package for southern states.</p>",
    date: "2026-07-17T18:07:39",
    dateGmt: "2026-07-17T18:07:39",
    categories: { nodes: [{ id: "c1", databaseId: 1, name: "Business", slug: "business" }] },
    author: { node: { id: "a1", databaseId: 1, name: "Staff", slug: "staff" } },
  } as Post;

  it("formats article links for the Latest news section", () => {
    const line = formatLlmsArticleLink(post);
    expect(line).toMatch(/^- \[/);
    expect(line).toContain("Cabinet clears infrastructure push");
    expect(line).toContain("/india/cabinet-clears-infrastructure-push/");
    expect(line).toContain("A multi-year package");
  });

  it("builds a valid llms.txt with H1, blockquote, and latest news", () => {
    const body = buildLlmsTxt({
      siteName: "News Next",
      siteDescription: "Breaking news from India",
      siteUrl: "https://example.com",
      locale: "en-IN",
      country: "IN",
      timezone: "Asia/Kolkata",
      contactEmail: "editor@example.com",
      posts: [post],
    });

    expect(body.startsWith("# News Next\n")).toBe(true);
    expect(body).toContain("> Breaking news from India");
    expect(body).toContain("## Latest news");
    expect(body).toContain("## Optional");
    expect(body).toContain("llms-full.txt");
    expect(body).toContain(formatLlmsArticleLink(post));
  });

  it("builds llms-full.txt article summaries", () => {
    const body = buildLlmsFullTxt({
      siteName: "News Next",
      siteDescription: "Breaking news from India",
      siteUrl: "https://example.com",
      locale: "en-IN",
      posts: [post],
    });

    expect(body).toContain("# News Next — AI-ready article summaries");
    expect(body).toContain("## Cabinet clears infrastructure push");
    expect(body).toContain("Section: Business");
    expect(body).toContain("Author: Staff");
  });
});

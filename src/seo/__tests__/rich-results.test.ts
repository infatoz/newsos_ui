import {
  newsArticleJsonLd,
  liveBlogPostingJsonLd,
  webStoryJsonLd,
  imageGalleryJsonLd,
  videoObjectJsonLd,
  breadcrumbJsonLd,
} from "../json-ld";
import { assertRichResultsPass } from "../validate-rich-results";

describe("Google Rich Results schema builders", () => {
  const base = {
    url: "https://example.com/sample/",
    publisherName: "Example News",
    publisherLogoUrl: "https://example.com/logo.png",
    authorName: "Reporter Name",
    authorUrl: "https://example.com/author/reporter/",
    inLanguage: "en-IN",
  };

  it("NewsArticle passes without errors or warnings", () => {
    assertRichResultsPass(
      newsArticleJsonLd({
        ...base,
        headline: "Major development reshapes regional politics",
        description: "A concise summary of the story for Discover and News.",
        image: {
          url: "https://example.com/images/hero-1200.jpg",
          width: 1200,
          height: 675,
        },
        datePublished: "2026-07-17T10:00:00+05:30",
        dateModified: "2026-07-17T12:00:00+05:30",
        section: "Politics",
        keywords: ["politics", "india"],
      }),
      { allowWarnings: false },
    );
  });

  it("ensureIsoDate always adds timezone for WP dateGmt", async () => {
    const { ensureIsoDate } = await import("../json-ld");
    expect(ensureIsoDate("2026-07-17T18:07:39")).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
    expect(ensureIsoDate("2026-07-17 18:07:39")).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });

  it("LiveBlogPosting passes without errors or warnings", () => {
    assertRichResultsPass(
      liveBlogPostingJsonLd({
        ...base,
        headline: "Live: Election results night",
        description: "Minute-by-minute coverage.",
        image: {
          url: "https://example.com/images/live.jpg",
          width: 1200,
          height: 675,
        },
        datePublished: "2026-07-17T08:00:00Z",
        coverageStartTime: "2026-07-17T08:00:00Z",
        coverageEndTime: "2026-07-17T20:00:00Z",
        isLive: true,
        updates: [
          {
            headline: "Polls close",
            articleBody: "Voting has ended across all constituencies.",
            datePublished: "2026-07-17T09:00:00Z",
          },
        ],
      }),
      { allowWarnings: false },
    );
  });

  it("LiveBlogPosting auto-fills coverageEndTime when still live", () => {
    const ld = liveBlogPostingJsonLd({
      ...base,
      headline: "Live coverage",
      description: "Ongoing",
      image: "https://example.com/images/live.jpg",
      datePublished: "2026-07-17T08:00:00Z",
      coverageStartTime: "2026-07-17T08:00:00Z",
      isLive: true,
      updates: [
        {
          headline: "First update",
          articleBody: "Coverage has started.",
          datePublished: "2026-07-17T08:05:00Z",
        },
      ],
    });
    expect(typeof ld.coverageEndTime).toBe("string");
    expect(ld.coverageEndTime).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.+Z$/,
    );
    assertRichResultsPass(ld, { allowWarnings: false });
  });

  it("Web Story Article passes without errors or warnings", () => {
    assertRichResultsPass(
      webStoryJsonLd({
        headline: "Five photos from the monsoon",
        description: "Visual story.",
        url: "https://example.com/amp/stories/monsoon/",
        image: "https://example.com/stories/cover.jpg",
        datePublished: "2026-07-16T06:00:00Z",
        dateModified: "2026-07-16T06:00:00Z",
        publisherName: base.publisherName,
        publisherLogoUrl: base.publisherLogoUrl,
        authorName: base.authorName,
        inLanguage: "en-IN",
      }),
      { allowWarnings: false },
    );
  });

  it("ImageGallery passes without errors or warnings", () => {
    assertRichResultsPass(
      imageGalleryJsonLd({
        name: "City in pictures",
        description: "A photo essay.",
        url: "https://example.com/photos/city/",
        datePublished: "2026-07-15T05:00:00Z",
        dateModified: "2026-07-15T05:00:00Z",
        authorName: base.authorName,
        authorUrl: base.authorUrl,
        publisherName: base.publisherName,
        publisherLogoUrl: base.publisherLogoUrl,
        images: [
          {
            url: "https://example.com/photos/1.jpg",
            width: 1600,
            height: 900,
            caption: "Dawn skyline",
          },
        ],
      }),
      { allowWarnings: false },
    );
  });

  it("VideoObject passes without errors or warnings", () => {
    assertRichResultsPass(
      videoObjectJsonLd({
        name: "Interview with the minister",
        description: "Full interview clip.",
        thumbnailUrl: "https://example.com/videos/thumb.jpg",
        uploadDate: "2026-07-14T11:00:00Z",
        contentUrl: "https://example.com/videos/interview.mp4",
        url: "https://example.com/videos/interview/",
        publisherName: base.publisherName,
        publisherLogoUrl: base.publisherLogoUrl,
      }),
      { allowWarnings: false },
    );
  });

  it("BreadcrumbList has no errors", () => {
    assertRichResultsPass(
      breadcrumbJsonLd([
        { name: "Home", url: "https://example.com/" },
        { name: "Politics", url: "https://example.com/politics/" },
        { name: "Story", url: "https://example.com/politics/story/" },
      ]),
      { allowWarnings: false },
    );
  });
});

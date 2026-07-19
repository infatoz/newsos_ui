/**
 * Local Google Rich Results–style validator.
 * Mirrors Search Central recommended properties for Article, LiveBlogPosting,
 * VideoObject, ImageGallery, and BreadcrumbList so CI can catch errors
 * before submitting URLs to https://search.google.com/test/rich-results
 */

import {
  ensureIsoDate,
  HEADLINE_MAX_CHARS,
  type JsonLd,
} from "./json-ld";

export type RichResultSeverity = "error" | "warning";

export interface RichResultIssue {
  severity: RichResultSeverity;
  path: string;
  message: string;
}

export interface RichResultReport {
  type: string;
  ok: boolean;
  errors: RichResultIssue[];
  warnings: RichResultIssue[];
}

const ISO_TZ =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getType(node: Record<string, unknown>): string {
  const t = node["@type"];
  if (Array.isArray(t)) return String(t[0] ?? "");
  return String(t ?? "");
}

function requireString(
  node: Record<string, unknown>,
  key: string,
  issues: RichResultIssue[],
  severity: RichResultSeverity = "error",
): string | null {
  const value = node[key];
  if (typeof value !== "string" || !value.trim()) {
    issues.push({
      severity,
      path: key,
      message: `Missing or empty "${key}"`,
    });
    return null;
  }
  return value.trim();
}

function requireIsoDate(
  node: Record<string, unknown>,
  key: string,
  issues: RichResultIssue[],
  pathPrefix = "",
): void {
  const path = pathPrefix ? `${pathPrefix}.${key}` : key;
  const value = node[key];
  if (typeof value !== "string" || !value.trim()) {
    issues.push({
      severity: "error",
      path,
      message: `Missing or empty "${key}"`,
    });
    return;
  }
  if (!ISO_TZ.test(value.trim())) {
    issues.push({
      severity: "error",
      path,
      message: `"${key}" must be ISO-8601 with timezone (got "${value}")`,
    });
  }
}

function validateAuthor(
  node: Record<string, unknown>,
  issues: RichResultIssue[],
  options?: { warnMissingUrl?: boolean },
): void {
  const author = node.author;
  if (!author) {
    issues.push({
      severity: "error",
      path: "author",
      message: 'Missing "author"',
    });
    return;
  }
  const authors = Array.isArray(author) ? author : [author];
  authors.forEach((a, i) => {
    const rec = asRecord(a);
    if (!rec || typeof rec.name !== "string" || !rec.name.trim()) {
      issues.push({
        severity: "error",
        path: `author[${i}].name`,
        message: "author.name is required",
      });
    }
    if (options?.warnMissingUrl !== false && rec && !rec.url) {
      issues.push({
        severity: "warning",
        path: `author[${i}].url`,
        message: "author.url recommended for E-E-A-T / Top Stories",
      });
    }
  });
}

function hasImage(node: Record<string, unknown>): boolean {
  const image = node.image;
  if (!image) return false;
  if (typeof image === "string") return Boolean(image.trim());
  if (Array.isArray(image)) return image.length > 0;
  const rec = asRecord(image);
  return Boolean(rec && (rec.url || rec.contentUrl));
}

function validatePublisher(
  node: Record<string, unknown>,
  issues: RichResultIssue[],
): void {
  const pub = asRecord(node.publisher);
  if (!pub) {
    issues.push({
      severity: "error",
      path: "publisher",
      message: 'Missing "publisher"',
    });
    return;
  }
  if (typeof pub.name !== "string" || !pub.name.trim()) {
    issues.push({
      severity: "error",
      path: "publisher.name",
      message: "publisher.name is required",
    });
  }
  const logo = asRecord(pub.logo);
  const logoUrl =
    (logo && (logo.url || logo.contentUrl)) ||
    (typeof pub.logo === "string" ? pub.logo : null);
  if (!logoUrl) {
    issues.push({
      severity: "error",
      path: "publisher.logo",
      message: "publisher.logo url is required",
    });
  }
}

function validateArticleLike(
  node: Record<string, unknown>,
  options?: { warnMissingAuthorUrl?: boolean },
): RichResultIssue[] {
  const issues: RichResultIssue[] = [];
  const headline = requireString(node, "headline", issues);
  if (headline && headline.length > HEADLINE_MAX_CHARS) {
    issues.push({
      severity: "warning",
      path: "headline",
      message: `headline exceeds ${HEADLINE_MAX_CHARS} characters (may truncate in Top Stories)`,
    });
  }
  if (!hasImage(node)) {
    issues.push({
      severity: "error",
      path: "image",
      message: 'Missing "image" (recommended high-res ≥1200px wide)',
    });
  }
  requireIsoDate(node, "datePublished", issues);
  if (node.dateModified) requireIsoDate(node, "dateModified", issues);
  validateAuthor(node, issues, {
    warnMissingUrl: options?.warnMissingAuthorUrl !== false,
  });
  validatePublisher(node, issues);
  if (!node.mainEntityOfPage && !node.url) {
    issues.push({
      severity: "warning",
      path: "url",
      message: "url or mainEntityOfPage recommended",
    });
  }
  return issues;
}

function validateLiveBlog(node: Record<string, unknown>): RichResultIssue[] {
  // Live blogs use a single Person author; url is recommended but not required for RRT.
  const issues = validateArticleLike(node, { warnMissingAuthorUrl: false });
  requireIsoDate(node, "coverageStartTime", issues);
  // Google treats coverageEndTime as required for LiveBlogPosting rich results.
  requireIsoDate(node, "coverageEndTime", issues);
  const updates = node.liveBlogUpdate;
  if (!Array.isArray(updates) || updates.length === 0) {
    issues.push({
      severity: "error",
      path: "liveBlogUpdate",
      message: "liveBlogUpdate must include at least one BlogPosting",
    });
  } else {
    updates.forEach((u, i) => {
      const rec = asRecord(u);
      if (!rec) {
        issues.push({
          severity: "error",
          path: `liveBlogUpdate[${i}]`,
          message: "Invalid live blog update",
        });
        return;
      }
      if (getType(rec) !== "BlogPosting") {
        issues.push({
          severity: "error",
          path: `liveBlogUpdate[${i}].@type`,
          message: 'Each update must be "@type": "BlogPosting"',
        });
      }
      if (typeof rec.headline !== "string" || !rec.headline.trim()) {
        issues.push({
          severity: "error",
          path: `liveBlogUpdate[${i}].headline`,
          message: "headline is required on each update",
        });
      }
      if (typeof rec.articleBody !== "string" || !rec.articleBody.trim()) {
        issues.push({
          severity: "error",
          path: `liveBlogUpdate[${i}].articleBody`,
          message: "articleBody is required on each update",
        });
      }
      requireIsoDate(rec, "datePublished", issues, `liveBlogUpdate[${i}]`);
    });
  }
  return issues;
}

function validateVideo(node: Record<string, unknown>): RichResultIssue[] {
  const issues: RichResultIssue[] = [];
  requireString(node, "name", issues);
  requireString(node, "description", issues, "warning");
  requireIsoDate(node, "uploadDate", issues);
  const thumbs = node.thumbnailUrl;
  const hasThumb =
    (typeof thumbs === "string" && thumbs.trim()) ||
    (Array.isArray(thumbs) && thumbs.length > 0);
  if (!hasThumb) {
    issues.push({
      severity: "error",
      path: "thumbnailUrl",
      message: "thumbnailUrl is required",
    });
  }
  if (!node.contentUrl && !node.embedUrl) {
    issues.push({
      severity: "error",
      path: "contentUrl|embedUrl",
      message: "Provide contentUrl and/or embedUrl",
    });
  }
  validatePublisher(node, issues);
  return issues;
}

function validateImageGallery(node: Record<string, unknown>): RichResultIssue[] {
  const issues: RichResultIssue[] = [];
  requireString(node, "name", issues);
  requireString(node, "url", issues, "warning");
  validateAuthor(node, issues);
  validatePublisher(node, issues);
  if (node.datePublished) requireIsoDate(node, "datePublished", issues);
  const media = node.associatedMedia;
  if (!Array.isArray(media) || media.length === 0) {
    issues.push({
      severity: "error",
      path: "associatedMedia",
      message: "associatedMedia must list ImageObject items",
    });
  }
  return issues;
}

function validateBreadcrumb(node: Record<string, unknown>): RichResultIssue[] {
  const issues: RichResultIssue[] = [];
  const items = node.itemListElement;
  if (!Array.isArray(items) || items.length < 2) {
    issues.push({
      severity: "warning",
      path: "itemListElement",
      message: "BreadcrumbList should have at least 2 items",
    });
  }
  return issues;
}

export function validateJsonLdNode(node: Record<string, unknown>): RichResultReport {
  const type = getType(node);
  let issues: RichResultIssue[] = [];

  switch (type) {
    case "NewsArticle":
    case "BlogPosting":
      issues = validateArticleLike(node);
      break;
    case "Article":
      // Web Stories often use org/person without profile URL.
      issues = validateArticleLike(node, { warnMissingAuthorUrl: false });
      break;
    case "LiveBlogPosting":
      issues = validateLiveBlog(node);
      break;
    case "VideoObject":
      issues = validateVideo(node);
      break;
    case "ImageGallery":
      issues = validateImageGallery(node);
      break;
    case "BreadcrumbList":
      issues = validateBreadcrumb(node);
      break;
    default:
      issues = [
        {
          severity: "warning",
          path: "@type",
          message: `No Rich Results rules registered for type "${type}"`,
        },
      ];
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  return {
    type,
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateJsonLd(data: JsonLd): RichResultReport[] {
  const nodes = Array.isArray(data) ? data : [data];
  return nodes
    .map((n) => asRecord(n))
    .filter(Boolean)
    .map((n) => validateJsonLdNode(n!));
}

/** Assert helpers used by Jest — fails on any error (warnings allowed unless strict). */
export function assertRichResultsPass(
  data: JsonLd,
  options?: { allowWarnings?: boolean },
): void {
  const reports = validateJsonLd(data);
  const errors = reports.flatMap((r) =>
    r.errors.map((e) => `[${r.type}] ${e.path}: ${e.message}`),
  );
  const warnings = reports.flatMap((r) =>
    r.warnings.map((w) => `[${r.type}] ${w.path}: ${w.message}`),
  );

  if (errors.length) {
    throw new Error(
      `Rich Results errors:\n${errors.join("\n")}${
        warnings.length ? `\nWarnings:\n${warnings.join("\n")}` : ""
      }`,
    );
  }
  if (!options?.allowWarnings && warnings.length) {
    throw new Error(`Rich Results warnings:\n${warnings.join("\n")}`);
  }
}

/** Smoke fixtures — ensure builders stay Google-clean. */
export function sampleIso(): string {
  return ensureIsoDate("2026-07-17T10:00:00+05:30");
}

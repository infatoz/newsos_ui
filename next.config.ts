import type { NextConfig } from "next";

function hostnameFromUrl(value?: string | null): string | null {
  if (!value?.trim()) return null;
  try {
    const raw = value.trim();
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return url.hostname || null;
  } catch {
    return null;
  }
}

/**
 * Hosts allowed for next/image. On Vercel, if NEXT_PUBLIC_WP_HOST is missing,
 * derive it from the GraphQL / logo URLs so CMS media is not rejected (HTTP 400).
 */
function collectImageHosts(): string[] {
  const hosts = new Set<string>();

  const candidates = [
    process.env.NEXT_PUBLIC_WP_HOST,
    process.env.WORDPRESS_HOSTNAME,
    hostnameFromUrl(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT),
    hostnameFromUrl(process.env.NEXT_PUBLIC_LOGO),
    hostnameFromUrl(process.env.NEXT_PUBLIC_FAVICON),
    hostnameFromUrl(process.env.NEXT_PUBLIC_CDN_URL),
    hostnameFromUrl(process.env.NEXT_PUBLIC_SITE_URL),
    "localhost",
    "127.0.0.1",
    // Production CMS used by newsos_ui / Karnataka Cricket
    "api.karnatakacricket.com",
  ];

  for (const host of candidates) {
    const cleaned = host?.trim().toLowerCase();
    if (cleaned) hosts.add(cleaned);
  }

  return [...hosts];
}

const imageHosts = collectImageHosts();

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    // Baseline CSP — includes AMP CDN so /…/amp pages can load the runtime.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.ampproject.org https://www.googletagmanager.com https://www.google-analytics.com https://cdn.onesignal.com",
      "style-src 'self' 'unsafe-inline' https://cdn.ampproject.org https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data: https://fonts.gstatic.com https://cdn.ampproject.org",
      "connect-src 'self' https: http: ws: wss:",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.googletagmanager.com https://cdn.ampproject.org",
      "media-src 'self' https: blob:",
      "object-src 'none'",
      "worker-src 'self' blob:",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const remotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = [];

for (const hostname of imageHosts) {
  remotePatterns.push(
    { protocol: "https", hostname, pathname: "/**" },
    { protocol: "http", hostname, pathname: "/**" },
  );
}

// Third-party media commonly used by WordPress / demos
for (const hostname of [
  "**.wp.com",
  "i0.wp.com",
  "i1.wp.com",
  "i2.wp.com",
  "secure.gravatar.com",
  "images.unsplash.com",
]) {
  remotePatterns.push({
    protocol: "https",
    hostname,
    pathname: "/**",
  });
}

const nextConfig: NextConfig = {
  // Required for multi-stage Docker (copies `.next/standalone`)
  output: "standalone",
  images: {
    // Next.js 16 blocks private/loopback IPs (localhost) for SSRF protection.
    // Required for Laragon / local WordPress media during development.
    dangerouslyAllowLocalIP: true,
    remotePatterns,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24,
  },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    // Legacy AMP path → trailing /amp (category resolved by the AMP route 301).
    return [
      {
        source: "/amp/article/:slug",
        destination: "/article/:slug/amp",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

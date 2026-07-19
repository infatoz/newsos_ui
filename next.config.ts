import type { NextConfig } from "next";

const wordpressHost =
  process.env.NEXT_PUBLIC_WP_HOST ||
  process.env.WORDPRESS_HOSTNAME ||
  "localhost";

const cdnHost = (() => {
  const cdn = process.env.NEXT_PUBLIC_CDN_URL;
  if (!cdn) return null;
  try {
    return new URL(cdn).hostname;
  } catch {
    return null;
  }
})();

const siteHost = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    ).hostname;
  } catch {
    return "localhost";
  }
})();

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
> = [
  {
    protocol: "http",
    hostname: wordpressHost,
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: wordpressHost,
    pathname: "/**",
  },
  {
    protocol: "http",
    hostname: "localhost",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "**.wp.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "i0.wp.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "i1.wp.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "i2.wp.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "secure.gravatar.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "images.unsplash.com",
    pathname: "/**",
  },
];

if (cdnHost) {
  remotePatterns.push(
    {
      protocol: "https",
      hostname: cdnHost,
      pathname: "/**",
    },
    {
      protocol: "http",
      hostname: cdnHost,
      pathname: "/**",
    },
  );
}

if (siteHost && siteHost !== wordpressHost && siteHost !== "localhost") {
  remotePatterns.push({
    protocol: "https",
    hostname: siteHost,
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
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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

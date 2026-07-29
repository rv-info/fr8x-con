// FR8X-CON robots.ts — Production SEO
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fr8x.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/feeds", "/auctions", "/rates", "/jobs"],
        disallow: [
          "/godmode",
          "/godmode/*",
          "/api/*",
          "/profile",
          "/messages",
          "/contacts",
          "/settings",
          "/_next",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

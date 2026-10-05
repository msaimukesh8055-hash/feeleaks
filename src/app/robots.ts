// src/app/robots.ts
// Search engines may index everything except personal tools (edit, letters, writing).

import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/leak", "/report/*/edit", "/report/*/action"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}

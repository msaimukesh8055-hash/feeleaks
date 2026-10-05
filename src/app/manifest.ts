// src/app/manifest.ts
// Web app manifest, so FeeLeaks can be added to the home screen (needed for
// notifications on iPhone).

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FeeLeaks",
    short_name: "FeeLeaks",
    description: "What schools, colleges and tuition centres really charge, reported anonymously by parents.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0d10",
    theme_color: "#0b0d10",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static SPA: data, audio and the speech model all run on the device, so it can be hosted anywhere and works offline.
  output: "export",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

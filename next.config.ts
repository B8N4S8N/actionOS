import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every workspace screen renders per-request data scoped to the signed-in
  // staff member, so the cache-components model buys us nothing here and makes
  // dynamic reads harder to reason about. Revisit when public, cacheable pages
  // (marketing, resource directories) outnumber authenticated ones.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  typedRoutes: true,
};

export default nextConfig;

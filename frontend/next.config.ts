
import type { NextConfig } from "next";

import { defaultLocale, locales } from "./src/i18n/config";

const nextConfig: NextConfig = {
  output: "standalone",

  reactStrictMode: true,
  images: { unoptimized: true },
  experimental: { typedRoutes: true },
  i18n: {
    locales: [...locales],
    defaultLocale,

    localeDetection: false,
  },
};
export default nextConfig;


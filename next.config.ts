import type { NextConfig } from "next";
import { version } from "./package.json";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
  // Inlined into the client bundle so the menu can show which build is live.
  env: { NEXT_PUBLIC_APP_VERSION: version },
};

export default nextConfig;

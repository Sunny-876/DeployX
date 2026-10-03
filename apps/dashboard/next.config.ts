import type { NextConfig } from "next";
import path from "path";
import fs from "fs";

// In monorepo local dev, set turbopack root to monorepo root if pnpm-workspace.yaml exists
const monorepoRoot = path.resolve(__dirname, "../../");
const isMonorepo = fs.existsSync(path.join(monorepoRoot, "pnpm-workspace.yaml"));

const nextConfig: NextConfig = {
  turbopack: isMonorepo
    ? {
        root: monorepoRoot,
      }
    : undefined,
};

export default nextConfig;

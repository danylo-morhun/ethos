import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: ["@ethos/ui", "@ethos/db"],
};

export default nextConfig;

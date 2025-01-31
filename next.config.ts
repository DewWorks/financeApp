import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = { fs: false, canvas: false };
        }
        return config;
    }
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: false,
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = { fs: false, canvas: false };
        }
        return config;
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // @ts-ignore
    eslint: {
        ignoreDuringBuilds: true,
    }
};

export default nextConfig;

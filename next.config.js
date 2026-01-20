/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
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
    eslint: {
        ignoreDuringBuilds: true,
    }
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = { fs: false, canvas: false };
        }
        return config;
    },
    typescript: {
        ignoreBuildErrors: true,
    }
};

module.exports = nextConfig;

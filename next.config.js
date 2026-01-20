/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    reactStrictMode: false,
    typescript: {
        ignoreBuildErrors: true,
    }
};

module.exports = nextConfig;

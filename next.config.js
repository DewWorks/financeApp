const withSerwist = require("@serwist/next").default({
    swSrc: "src/app/sw.ts",
    swDest: "public/sw.js",
    disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: "standalone",
    reactStrictMode: false,
    typescript: {
        ignoreBuildErrors: true,
    },
    // Garante compatibilidade
    webpack: (config) => {
        return config;
    },
}

// module.exports = withSerwist(nextConfig);
module.exports = nextConfig;

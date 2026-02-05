const withSerwist = require("@serwist/next").default({
    swSrc: "src/app/sw.ts",
    swDest: "public/sw.js",
    disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    // FIX: Transpile the problematic package causing 405/500 errors
    transpilePackages: ['@exodus/bytes'],

    reactStrictMode: false,
    typescript: {
        ignoreBuildErrors: true,
    },
    webpack: (config) => {
        return config;
    },
}

// module.exports = withSerwist(nextConfig);
module.exports = nextConfig;

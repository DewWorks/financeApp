const withSerwist = require("@serwist/next").default({
    swSrc: "src/app/sw.ts",
    swDest: "public/sw.js",
    // Temporarily disabled for production debugging
    disable: true, // process.env.NODE_ENV === "development",
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
    trailingSlash: false,
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
                    { key: 'X-DNS-Prefetch-Control', value: 'on' },
                    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                ],
            },
        ]
    }
};

// module.exports = withSerwist(nextConfig);
module.exports = nextConfig;

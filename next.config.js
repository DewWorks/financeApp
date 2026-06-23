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
    async headers() {
        return [
            {
                // Applica a todas as rotas
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY', // Proteção contra Clickjacking
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block', // Proteção clássica para navegadores antigos
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin', // Controle de dados sensíveis na URL
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload', // Força HTTPS por 1 ano
                    },
                    {
                        key: 'Content-Security-Policy',
                        // CSP Base que permite execução do próprio domínio, scripts de auth e analytics comuns, APIs externas.
                        // Ajustar as permissões de imagem e API para pluggy e asaas se necessário futuramente.
                        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.clarity.ms https://*.hotjar.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' blob: data: https://*; connect-src 'self' https://api.pluggy.ai wss://*.hotjar.com https://*.hotjar.com https://*.hotjar.io https://sandbox.asaas.com https://api.asaas.com; frame-ancestors 'none';"
                    }
                ],
            },
        ]
    },
}

// module.exports = withSerwist(nextConfig);
module.exports = nextConfig;

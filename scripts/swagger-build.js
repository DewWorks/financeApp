const { createSwaggerSpec } = require('next-swagger-doc');
const fs = require('fs');
const path = require('path');

const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'FinancePro API Documentation',
            version: '1.0',
            description: 'Documentação oficial da API do FinancePro. Acesso restrito a administradores.',
            contact: {
                name: 'Suporte FinancePro',
                email: 'suporte@financepro.com'
            }
        },
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [],
    },
});

const outputPath = path.join(process.cwd(), 'public', 'swagger.json');
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
console.log(`Swagger spec generated at ${outputPath}`);

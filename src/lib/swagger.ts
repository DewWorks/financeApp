import { createSwaggerSpec } from 'next-swagger-doc';
import path from 'path';

export const getApiDocs = async () => {
    const spec = createSwaggerSpec({
        apiFolder: path.join(process.cwd(), 'src/app/api'), // define api folder
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
    return spec;
};

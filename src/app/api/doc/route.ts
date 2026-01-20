import { getApiDocs } from "@/lib/swagger";
import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Tenta ler o arquivo estático gerado (Ideal para Produção)
        const staticPath = path.join(process.cwd(), 'public', 'swagger.json');
        if (fs.existsSync(staticPath)) {
            const fileContent = fs.readFileSync(staticPath, 'utf-8');
            return NextResponse.json(JSON.parse(fileContent));
        }
    } catch (error) {
        console.warn("Could not load static swagger.json, falling back to runtime generation.");
    }

    // Fallback: Gera em tempo de execução (Ideal para Dev Local)
    const spec = await getApiDocs();
    return NextResponse.json(spec);
}

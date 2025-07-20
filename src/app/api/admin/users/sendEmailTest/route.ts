import { sendTestEmail } from "@/app/functions/emails/sendEmailTest";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const result = await sendTestEmail();
        return NextResponse.json({ message: "E-mail de teste enviado com sucesso", result }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Falha no envio do e-mail de teste", error }, { status: 500 });
    }
}

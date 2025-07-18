import { sendEmailsToAllUsers } from "@/app/functions/sendEmailUsers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const result = await sendEmailsToAllUsers();
        return NextResponse.json({ message: "E-mails enviados com sucesso", result }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Falha no envio de e-mails", error }, { status: 500 });
    }
}

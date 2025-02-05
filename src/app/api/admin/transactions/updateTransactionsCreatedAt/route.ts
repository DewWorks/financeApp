import { updateAllTransactionsWithCreatedAt } from "@/app/functions/updateTransactionsCreatedAt";
import { NextResponse } from 'next/server'

// Rota para atualizar os campos tutorialGuide e executeQuery
export async function GET() {
    try {
        const result = await updateAllTransactionsWithCreatedAt();
        return NextResponse.json({ message: 'Update users successful', result}, { status: 200 })
    }catch (error){
        return NextResponse.json({ message: 'Update users failed', error}, { status: 500 })
    }
};



import { updateAllUsersFields } from "@/app/functions/executeQuery";
import { NextResponse } from 'next/server'

// Rota para atualizar os campos tutorialGuide e executeQuery
export async function GET(request: Request) {
    try {
        const result = await updateAllUsersFields();
        return NextResponse.json({ message: 'Update users successful', result}, { status: 200 })
    }catch (error){
        return NextResponse.json({ message: 'Update users failed', error}, { status: 500 })
    }
};



import { NextResponse } from 'next/server';
import { getMongoClient } from '@/db/connectionDb';

// Allow Vercel Cron to run for up to 60s
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Vercel Cron Authentication (Optional but recommended)
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { return new NextResponse('Unauthorized', { status: 401 }); }

    try {
        console.log("⏳ Starting Automated Backup...");
        const client = await getMongoClient();
        const db = client.db("financeApp");
        const collections = ['users', 'transactions', 'auditlogs'];

        const attachments = [];

        for (const col of collections) {
            const data = await db.collection(col).find({}).toArray();
            attachments.push({
                filename: `${col}_backup_${new Date().toISOString().split('T')[0]}.json`,
                content: JSON.stringify(data, null, 2),
                contentType: 'application/json'
            });
        }

        // Send Email using existing functionality (adapted for attachments)
        // We need to verify if 'sendEmail' supports attachments. 
        // If not, we might need to use nodemailer directly here or update sendEmail. 
        // Assuming we need to extend sendEmail or use nodemailer directly for this special case.

        const transporter = (await import('nodemailer')).createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to self (Admin)
            subject: `📦 FinanceApp Backup - ${new Date().toLocaleDateString()}`,
            text: 'Segue em anexo o backup diário dos dados do sistema.',
            attachments: attachments
        });

        console.log("✅ Backup sent via Email.");
        return NextResponse.json({ message: 'Backup emailed successfully' });

    } catch (error) {
        console.error("❌ Backup Job Failed:", error);
        return NextResponse.json({ error: 'Backup failed' }, { status: 500 });
    }
}

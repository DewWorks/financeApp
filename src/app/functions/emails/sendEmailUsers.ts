import { getMongoClient } from '@/db/connectionDb';
import { sendEmail } from './sendEmail';

export async function sendEmailToAllUsers({ subject, htmlContent }: { subject: string; htmlContent: string }) {
    try {
        const client = await getMongoClient();
        const db = client.db('financeApp');
        const users = await db.collection('users').find({}, { projection: { email: 1 } }).toArray();

        const emailList = users.map(u => u.email).filter(Boolean);

        for (const to of emailList) {
            await sendEmail({ to, subject, htmlContent });
        }

        return { success: true, message: `E-mails enviados para ${emailList.length} usuários.` };
    } catch (err) {
        console.error('Erro ao enviar e-mails:', err);
        return { success: false, message: 'Erro ao enviar e-mails.' };
    }
}

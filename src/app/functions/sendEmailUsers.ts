import { getMongoClient } from "@/db/connectionDb";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export async function sendEmailsToAllUsers() {
    try {
        // Conectar ao banco de dados
        const client = await getMongoClient();
        const db = client.db("financeApp");

        // Buscar todos os e-mails dos usuários
        const users = await db.collection("users").find({}, { projection: { email: 1 } }).toArray();
        const emailList = users.map(user => user.email).filter(email => email);

        if (!emailList.length) {
            console.log("Nenhum usuário encontrado com e-mail válido.");
            return { success: false, message: "Nenhum usuário encontrado com e-mail válido." };
        }

        // Configurar transporte de e-mail (Gmail)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: 'devworks.company.io@gmail.com', // E-mail remetente
                pass: 'xtao vfig oedl shvv', // Senha do App Password
            },
        });

        // Montar a mensagem do e-mail
        const emailOptions = {
            from: `"Equipe FinancePro" <${'devworks.company.io@gmail.com'}>`,
            subject: "🚀 Conheça o FinancePro - A Revolução da Gestão Financeira!",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #f4f4f4;">
    <div style="max-width: 600px; background: white; padding: 30px; border-radius: 10px; margin: auto;">
        <!-- LOGO -->
        <img src="https://finance-pro-mu.vercel.app/logo.png" alt="FinancePro" style="max-width: 180px; margin-bottom: 20px;">
        
        <h2 style="color: #0085FF;">💰 Cada Centavo Conta: Controle Seu Dinheiro com o FinancePro!</h2>
        
        <p style="font-size: 16px; color: #333;">
            Você já se perguntou **para onde vai seu dinheiro todo mês**?  
            Com o <strong>FinancePro</strong>, você finalmente terá **controle total** sobre suas finanças e saberá exatamente **onde cada centavo está indo**. 📊  
        </p>

        <h3 style="color: #0085FF;">✨ Transforme sua Vida Financeira</h3>
        <p style="font-size: 16px; color: #333;">Com nossa plataforma, você poderá:</p>
        
        <ul style="list-style: none; padding: 0;">
            <li style="font-size: 16px; padding: 5px 0;">✅ **Registrar todas as suas transações e despesas automaticamente**</li>
            <li style="font-size: 16px; padding: 5px 0;">📊 **Acompanhar gráficos simples e intuitivos** para ver onde seu dinheiro está indo</li>
            <li style="font-size: 16px; padding: 5px 0;">💡 **Criar metas financeiras** e alcançar seus sonhos mais rápido</li>
            <li style="font-size: 16px; padding: 5px 0;">🔒 **Tudo isso de forma simples, rápida e segura!**</li>
        </ul>

        <p style="font-size: 16px; color: #333;">
            Chega de sustos no final do mês! **Tenha o controle do seu dinheiro de forma fácil e automática.**
        </p>

        <br/>
        <a href="https://finance-pro-mu.vercel.app/" 
           style="display: inline-block; padding: 14px 28px; background-color: #0085FF; color: #fff; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold;">
            🚀 Experimente Grátis Agora!
        </a>
        <br/><br/>

        <p style="font-size: 14px; color: #777;">
            📢 **Mais de 10.000 pessoas** já estão organizando suas finanças com o FinancePro!  
            **Agora é sua vez!**
        </p>

        <p style="font-size: 14px; color: #777;">
            💙 Com carinho,  
            <strong>Equipe FinancePro</strong>
        </p>
    </div>
</div>
            `,
        };

        // Enviar e-mails individualmente para evitar spam
        for (const email of emailList) {
            await transporter.sendMail({ ...emailOptions, to: email });
            console.log(`E-mail enviado para: ${email}`);
        }

        console.log("Todos os e-mails foram enviados com sucesso!");
        return { success: true, message: `E-mails enviados para ${emailList.length} usuários.` };
    } catch (error) {
        console.error("Erro ao enviar e-mails:", error);
        return { success: false, message: "Erro ao enviar e-mails." };
    }
}

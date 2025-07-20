import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export async function sendTestEmail() {
    try {
        // Configuração do transporte de e-mail (Gmail)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: 'devworks.company.io@gmail.com', // E-mail remetente
                pass: 'ktxt vwog zzlp smcix', // Senha do App Password
            },
        });

        // Definir o e-mail de teste
        const emailOptions = {
            from: `"Equipe FinancePro" <${process.env.EMAIL_USER}>`,
            to: "joaovictorpfr@gmail.com", // E-mail do destinatário de teste
            subject: "🚀 Teste de E-mail do FinancePro",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                    <h2>🎯 Teste de E-mail do FinancePro</h2>
                    <p>Olá João Victor, este é um e-mail de teste para validar o envio pelo servidor.</p>
                    <p>Se este e-mail chegou corretamente, significa que o sistema de disparo está funcionando.</p>
                    <br/>
                    <a href="https://finance-pro-mu.vercel.app/" 
                       style="display: inline-block; padding: 12px 24px; background-color: #0085FF; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        🚀 Acesse o FinancePro
                    </a>
                    <br/><br/>
                    <p>Atenciosamente,</p>
                    <p><strong>Equipe FinancePro</strong></p>
                </div>
            `,
        };

        // Enviar o e-mail
        const info = await transporter.sendMail(emailOptions);
        console.log(`E-mail de teste enviado para ${emailOptions.to}: ${info.messageId}`);

        return { success: true, message: `E-mail enviado para ${emailOptions.to}.` };
    } catch (error) {
        console.error("Erro ao enviar e-mail de teste:", error);
        return { success: false, message: "Erro ao enviar e-mail de teste." };
    }
}

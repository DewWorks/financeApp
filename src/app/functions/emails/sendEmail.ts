import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import DOMPurify from 'isomorphic-dompurify';

dotenv.config();

type SendEmailParams = {
  to: string;
  subject: string;
  htmlContent: string;
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'devworks.company.io@gmail.com',
    pass: 'xtao vfig oedl shvv',
  },
});

export async function sendEmail({ to, subject, htmlContent }: SendEmailParams): Promise<{ success: boolean; message: string }> {
  try {
    console.time("sendEmail");

    // Sanitize content to prevent XSS/Injection
    const safeHtmlContent = DOMPurify.sanitize(htmlContent);

    const finalHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; background: white; padding: 30px; border-radius: 10px; margin: auto;">
          ${safeHtmlContent}
          <hr style="margin: 30px 0;" />
          <p style="font-size: 13px; color: #888; text-align: center;">
            Enviado por <strong>FinancePro</strong> · <a href="https://finance-pro-mu.vercel.app/" style="color: #0085FF;">finance-pro-mu.vercel.app</a>
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"FinancePro" <devworks.company.io@gmail.com>',
      to,
      subject,
      html: finalHtml,
    });

    console.timeEnd("sendEmail");

    console.log(`E-mail enviado para: ${to}`);
    return { success: true, message: `E-mail enviado para: ${to}` };
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return { success: false, message: 'Erro ao enviar e-mail' };
  }
}

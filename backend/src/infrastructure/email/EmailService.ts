import nodemailer from 'nodemailer';
import { Logger } from '../logging/logger';

export interface IEmailService {
    sendOTP(email: string, otpCode: string): Promise<void>;
}

export class NodemailerEmailService implements IEmailService {
    private transporter: nodemailer.Transporter | null = null;
    private initialized = false;

    constructor() {
        this.init();
    }

    private async init() {
        if (process.env.NODE_ENV === 'production') {
            // Setup for production email provider (e.g., SMTP standard or Resend via SMTP)
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
            this.initialized = true;
            Logger.info('Email service initialized for production');
        } else {
            // Setup Ethereal for development
            try {
                const testAccount = await nodemailer.createTestAccount();
                this.transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: testAccount.user, // generated ethereal user
                        pass: testAccount.pass, // generated ethereal password
                    },
                });
                this.initialized = true;
                Logger.info('Email service initialized using Ethereal (Development)');
            } catch (error) {
                Logger.error('Failed to initialize Ethereal email account:', error);
            }
        }
    }

    async sendOTP(email: string, otpCode: string): Promise<void> {
        if (!this.initialized || !this.transporter) {
            Logger.warn('Email service not initialized, skipping OTP email to: ' + email);
            return;
        }

        const mailOptions = {
            from: '"Javiandas" <noreply@javiandas.com>',
            to: email,
            subject: 'Tu código de verificación - Javiandas',
            text: `¡Hola! Tu código de verificación es: ${otpCode}. Expira en 15 minutos.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #4CAF50; text-align: center;">Javiandas</h2>
                    <p style="font-size: 16px; color: #333;">¡Hola!</p>
                    <p style="font-size: 16px; color: #333;">Gracias por registrarte. Por favor, usa el siguiente código para verificar tu cuenta:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #333; margin: 0; letter-spacing: 5px;">${otpCode}</h1>
                    </div>
                    <p style="font-size: 14px; color: #777; text-align: center;">Este código expira en 15 minutos.</p>
                </div>
            `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            Logger.info('OTP email sent to ' + email);
            
            if (process.env.NODE_ENV !== 'production') {
                Logger.info('Preview URL: ' + nodemailer.getTestMessageUrl(info));
            }
        } catch (error) {
            Logger.error('Error sending OTP email:', error);
            throw new Error('Failed to send verification email');
        }
    }
}

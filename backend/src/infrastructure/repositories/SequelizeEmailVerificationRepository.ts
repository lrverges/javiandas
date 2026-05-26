import { IEmailVerificationRepository } from '../../domain/repositories/IEmailVerificationRepository';
import { EmailVerification } from '../../domain/models/EmailVerification';
import { EmailVerificationModel } from '../database/models/EmailVerificationModel';

export class SequelizeEmailVerificationRepository implements IEmailVerificationRepository {
    async upsert(verification: EmailVerification): Promise<EmailVerification> {
        await EmailVerificationModel.upsert({
            email: verification.email,
            otpCode: verification.otpCode,
            expiresAt: verification.expiresAt,
            verified: verification.verified,
        });
        return verification;
    }

    async findByEmail(email: string): Promise<EmailVerification | null> {
        const doc = await EmailVerificationModel.findOne({ where: { email } });
        if (!doc) return null;
        return new EmailVerification({
            email: doc.email,
            otpCode: doc.otpCode,
            expiresAt: doc.expiresAt,
            verified: doc.verified,
        });
    }

    async deleteByEmail(email: string): Promise<void> {
        await EmailVerificationModel.destroy({ where: { email } });
    }
}

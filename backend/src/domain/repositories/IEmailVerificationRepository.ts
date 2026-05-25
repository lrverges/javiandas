import { EmailVerification } from '../models/EmailVerification';

export interface IEmailVerificationRepository {
    upsert(verification: EmailVerification): Promise<EmailVerification>;
    findByEmail(email: string): Promise<EmailVerification | null>;
    deleteByEmail(email: string): Promise<void>;
}

import { OAuth2Client } from 'google-auth-library';
import { IGoogleAuthProvider } from '../../domain/providers/IGoogleAuthProvider';
import { Logger } from '../logging/logger';

export class GoogleAuthProvider implements IGoogleAuthProvider {
    private client: OAuth2Client;

    constructor() {
        this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    async verifyIdToken(idToken: string): Promise<{ email: string; name: string } | null> {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            
            if (!payload || !payload.email) {
                return null;
            }

            return {
                email: payload.email,
                name: payload.name || '',
            };
        } catch (error) {
            Logger.error('Error verifying Google token', error);
            return null;
        }
    }
}

import { AuthService } from './application/services/authService';
import { SequelizeUserRepository } from './infrastructure/repositories/SequelizeUserRepository';
import dotenv from 'dotenv';
import { setupAssociations } from './infrastructure/database/associations';

dotenv.config();

class MockGoogleAuth {
    async verifyIdToken() {
        return {};
    }
}

async function run() {
    setupAssociations();
    const userRepo = new SequelizeUserRepository();
    const googleAuth = new MockGoogleAuth() as any;
    const authService = new AuthService(userRepo, googleAuth);

    try {
        const result = await authService.login('guest@guest.com', 'Pa$$w0rd123');
        console.log('🎉 Login result:', JSON.stringify(result, null, 2));
    } catch (err: any) {
        console.error('❌ Login threw an error:', err.message, err.stack);
    }
    process.exit(0);
}

run();

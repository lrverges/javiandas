import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IGoogleAuthProvider } from '../../domain/providers/IGoogleAuthProvider';
import { User } from '../../domain/models/User';
import { Logger } from '../../infrastructure/logging/logger';

export class AuthService {
    private static readonly DUMMY_HASH = '$2b$10$3tOiheoAkwkknfBAdFe0fOxsw1MhIxR41aPBNvPegHMajOrV/dCtm';

    constructor(
        private userRepository: IUserRepository,
        private googleAuthProvider: IGoogleAuthProvider
    ) {}

    private generateToken(user: User): string {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is missing.');
        }

        return jwt.sign(
            { userId: user.id, email: user.email },
            secret,
            { 
                expiresIn: '1h',
                issuer: 'javiandas-auth',
                audience: 'javiandas-frontend'
            }
        );
    }

    async login(email: string, password: string): Promise<{ token: string; user: any } | null> {
        const user = await this.userRepository.findByEmail(email);
        
        if (!user || !user.password) {
            // Mitigate timing attacks by always performing a bcrypt comparison with pre-generated hash
            await bcrypt.compare(password, AuthService.DUMMY_HASH);
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }

        const token = this.generateToken(user);

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }

    async loginWithGoogle(idToken: string): Promise<{ token: string; user: any } | null> {
        try {
            const payload = await this.googleAuthProvider.verifyIdToken(idToken);
            if (!payload) {
                return null;
            }

            const { email, name } = payload;

            let user = await this.userRepository.findByEmail(email);
            if (!user) {
                // Auto-registro para usuarios nuevos
                user = await this.userRepository.create(new User({ email, name }));
            }

            const token = this.generateToken(user);

            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            };
        } catch (error) {
            Logger.error('Error in loginWithGoogle:', error);
            return null;
        }
    }
}

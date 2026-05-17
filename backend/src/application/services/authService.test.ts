import { AuthService } from './authService';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IGoogleAuthProvider } from '../../domain/providers/IGoogleAuthProvider';
import { User } from '../../domain/models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
    let authService: AuthService;
    let mockUserRepository: jest.Mocked<IUserRepository>;
    let mockGoogleProvider: jest.Mocked<IGoogleAuthProvider>;

    beforeEach(() => {
        mockUserRepository = {
            findByEmail: jest.fn(),
            create: jest.fn(),
        };
        mockGoogleProvider = {
            verifyIdToken: jest.fn(),
        };
        
        process.env.JWT_SECRET = 'test-secret';
        authService = new AuthService(mockUserRepository, mockGoogleProvider);
    });

    afterEach(() => {
        delete process.env.JWT_SECRET;
        jest.clearAllMocks();
    });

    describe('Traditional Login', () => {
        it('should return token and user on successful login', async () => {
            const mockUser = new User({ id: 1, email: 'test@test.com', name: 'Test', password: 'hashed_password', role: 'user' });
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue('mock_token');

            const result = await authService.login('test@test.com', 'password');

            expect(result).toEqual({
                token: 'mock_token',
                user: { id: 1, email: 'test@test.com', name: 'Test', role: 'user' },
            });
        });

        it('should return null if user not found (and perform dummy hash to prevent timing attack)', async () => {
            mockUserRepository.findByEmail.mockResolvedValue(null);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await authService.login('notfound@test.com', 'password');

            expect(result).toBeNull();
            expect(bcrypt.compare).toHaveBeenCalledWith('password', '$2b$10$3tOiheoAkwkknfBAdFe0fOxsw1MhIxR41aPBNvPegHMajOrV/dCtm');
        });

        it('should return null if password invalid', async () => {
            const mockUser = new User({ id: 1, email: 'test@test.com', name: 'Test', password: 'hashed_password', role: 'user' });
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await authService.login('test@test.com', 'wrong_password');

            expect(result).toBeNull();
        });
        
        it('should throw error if JWT_SECRET is missing', async () => {
            delete process.env.JWT_SECRET;
            const mockUser = new User({ id: 1, email: 'test@test.com', name: 'Test', password: 'hashed_password', role: 'user' });
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await expect(authService.login('test@test.com', 'password')).rejects.toThrow('JWT_SECRET environment variable is missing.');
        });
    });

    describe('Google Login', () => {
        it('should return token for existing user via Google', async () => {
            const mockUser = new User({ id: 1, email: 'test@google.com', name: 'Google User', password: undefined, role: 'user' });
            mockGoogleProvider.verifyIdToken.mockResolvedValue({ email: 'test@google.com', name: 'Google User' });
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            (jwt.sign as jest.Mock).mockReturnValue('google_mock_token');

            const result = await authService.loginWithGoogle('valid_id_token');

            expect(result).toEqual({
                token: 'google_mock_token',
                user: { id: 1, email: 'test@google.com', name: 'Google User', role: 'user' },
            });
            expect(mockUserRepository.create).not.toHaveBeenCalled();
        });

        it('should create new user and return token if user does not exist via Google', async () => {
            mockGoogleProvider.verifyIdToken.mockResolvedValue({ email: 'new@google.com', name: 'New User' });
            mockUserRepository.findByEmail.mockResolvedValue(null);
            
            const newUser = new User({ id: 2, email: 'new@google.com', name: 'New User', role: 'user' });
            mockUserRepository.create.mockResolvedValue(newUser);
            (jwt.sign as jest.Mock).mockReturnValue('new_google_mock_token');

            const result = await authService.loginWithGoogle('valid_id_token');

            expect(result).toEqual({
                token: 'new_google_mock_token',
                user: { id: 2, email: 'new@google.com', name: 'New User', role: 'user' },
            });
            expect(mockUserRepository.create).toHaveBeenCalled();
        });

        it('should return null if Google token verification fails (returns null)', async () => {
            mockGoogleProvider.verifyIdToken.mockResolvedValue(null);

            const result = await authService.loginWithGoogle('invalid_id_token');

            expect(result).toBeNull();
        });

        it('should return null if Google provider throws an error', async () => {
            mockGoogleProvider.verifyIdToken.mockRejectedValue(new Error('Google API Error'));

            const result = await authService.loginWithGoogle('error_id_token');

            expect(result).toBeNull();
        });
    });
});

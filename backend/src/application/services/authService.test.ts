import { AuthService } from './authService';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IGoogleAuthProvider } from '../../domain/providers/IGoogleAuthProvider';
import { ICompanyEmployeeRepository } from '../../domain/repositories/ICompanyEmployeeRepository';
import { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import { IAddressRepository } from '../../domain/repositories/IAddressRepository';
import { IEmailVerificationRepository } from '../../domain/repositories/IEmailVerificationRepository';
import { User } from '../../domain/models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
    let authService: AuthService;
    let mockUserRepository: jest.Mocked<IUserRepository>;
    let mockGoogleProvider: jest.Mocked<IGoogleAuthProvider>;
    let mockCompanyEmployeeRepository: jest.Mocked<ICompanyEmployeeRepository>;
    let mockCompanyRepository: jest.Mocked<ICompanyRepository>;
    let mockAddressRepository: jest.Mocked<IAddressRepository>;
    let mockEmailVerificationRepository: jest.Mocked<IEmailVerificationRepository>;

    beforeEach(() => {
        mockUserRepository = {
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as any;
        mockGoogleProvider = {
            verifyIdToken: jest.fn(),
        } as any;
        mockCompanyEmployeeRepository = {
            create: jest.fn(),
            batchCreate: jest.fn(),
            remove: jest.fn(),
            findByCompanyId: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
        } as any;
        mockCompanyRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            findByCuit: jest.fn(),
        } as any;
        mockAddressRepository = {
            create: jest.fn(),
            findByUserId: jest.fn(),
            findDefaultByUserId: jest.fn(),
            update: jest.fn(),
        } as any;
        mockEmailVerificationRepository = {
            upsert: jest.fn(),
            findByEmail: jest.fn(),
            deleteByEmail: jest.fn()
        };
        
        process.env.JWT_SECRET = 'test-secret';
        authService = new AuthService(
            mockUserRepository,
            mockGoogleProvider,
            mockCompanyEmployeeRepository,
            mockCompanyRepository,
            mockAddressRepository,
            { sendOTP: jest.fn() } as any, // mock email service
            mockEmailVerificationRepository
        );
    });

    afterEach(() => {
        delete process.env.JWT_SECRET;
        jest.clearAllMocks();
    });

    describe('Traditional Login', () => {
        it('should return token and user on successful login', async () => {
            const mockUser = new User({ id: 1, email: 'test@test.com', name: 'Test', password: 'hashed_password', role: 'user', isVerified: true });
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue('mock_token');

            const result = await authService.login('test@test.com', 'password');

            expect(result).toEqual({
                token: 'mock_token',
                user: { 
                    id: 1, 
                    email: 'test@test.com', 
                    name: 'Test', 
                    role: 'user',
                    companyId: null,
                    firstName: undefined,
                    lastName: undefined,
                    phone: undefined,
                    dni: undefined,
                    isVerified: true
                },
            });
        });

        it('should return null if user not found', async () => {
            mockUserRepository.findByEmail.mockResolvedValue(null);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await authService.login('notfound@test.com', 'password');

            expect(result).toBeNull();
        });

        it('should return null if password invalid', async () => {
            const mockUser = new User({ id: 1, email: 'test@test.com', name: 'Test', password: 'hashed_password', role: 'user' });
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await authService.login('test@test.com', 'wrong_password');

            expect(result).toBeNull();
        });
    });

    describe('Google Login', () => {
        it('should return token for existing user via Google', async () => {
            const mockUser = new User({ id: 1, email: 'test@google.com', name: 'Google User', password: undefined, role: 'user', isVerified: true });
            mockGoogleProvider.verifyIdToken.mockResolvedValue({ email: 'test@google.com', name: 'Google User' });
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            (jwt.sign as jest.Mock).mockReturnValue('google_mock_token');

            const result = await authService.loginWithGoogle('valid_id_token');

            expect(result).toEqual({
                token: 'google_mock_token',
                user: { 
                    id: 1, 
                    email: 'test@google.com', 
                    name: 'Google User', 
                    role: 'user',
                    companyId: null,
                    firstName: undefined,
                    lastName: undefined,
                    phone: undefined,
                    dni: undefined,
                    isVerified: true
                },
            });
        });
    });

    describe('Verification First Flow', () => {
        describe('sendOtp', () => {
            it('should throw error if email already exists in users table', async () => {
                mockUserRepository.findByEmail.mockResolvedValue(new User({ id: 1, email: 'exist@test.com', name: 'Exist' }));
                await expect(authService.sendOtp('exist@test.com')).rejects.toThrow('Email is already registered');
            });

            it('should upsert verification and send email', async () => {
                mockUserRepository.findByEmail.mockResolvedValue(null);
                await authService.sendOtp('new@test.com');
                expect(mockEmailVerificationRepository.upsert).toHaveBeenCalled();
            });
        });

        describe('verifyOtp', () => {
            it('should throw error if no pending verification', async () => {
                mockEmailVerificationRepository.findByEmail.mockResolvedValue(null);
                await expect(authService.verifyOtp('test@test.com', '123456')).rejects.toThrow('No pending verification found');
            });

            it('should return corporate info if email is pending in active company', async () => {
                mockEmailVerificationRepository.findByEmail.mockResolvedValue({
                    email: 'corporate@company.com',
                    otpCode: '123456',
                    expiresAt: new Date(Date.now() + 10000),
                    verified: false
                } as any);
                
                mockCompanyEmployeeRepository.findByEmail.mockResolvedValue({
                    id: 1,
                    companyId: 5,
                    email: 'corporate@company.com',
                    status: 'pending'
                } as any);
                mockCompanyRepository.findById.mockResolvedValue({
                    id: 5,
                    name: 'Company Corp',
                    benefitType: 'Corporativo Premium',
                    allowExtraAddresses: true,
                    isActive: true,
                    street: 'A',
                    addressNumber: '1',
                    locality: 'B'
                } as any);

                const result = await authService.verifyOtp('corporate@company.com', '123456');
                expect(result).toEqual({
                    isCorporate: true,
                    companyId: 5,
                    companyName: 'Company Corp',
                    benefitType: 'Corporativo Premium',
                    allowExtraAddresses: true
                });
            });
        });

        describe('register', () => {
            it('should throw error if email not verified', async () => {
                mockEmailVerificationRepository.findByEmail.mockResolvedValue(null);
                const userData = new User({ email: 'new@test.com', name: 'New User' });
                await expect(authService.register(userData)).rejects.toThrow('Email is not verified');
            });

            it('should throw error if email already registered', async () => {
                mockEmailVerificationRepository.findByEmail.mockResolvedValue({ verified: true } as any);
                mockUserRepository.findByEmail.mockResolvedValue(new User({ id: 1, email: 'exist@test.com', name: 'Exist' }));
                const userData = new User({ email: 'exist@test.com', name: 'Exist' });
                await expect(authService.register(userData)).rejects.toThrow('Email is already registered');
            });
        });
    });
});

import { AuthController } from './authController';
import { AuthService } from '../../application/services/authService';
import { Request, Response, NextFunction } from 'express';

jest.mock('../../application/services/authService');

describe('AuthController', () => {
    let authController: AuthController;
    let mockAuthService: jest.Mocked<AuthService>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockAuthService = {
            login: jest.fn(),
            loginWithGoogle: jest.fn(),
        } as any;

        authController = new AuthController(mockAuthService);

        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis(),
        };
        nextFunction = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Traditional Login', () => {
        it('should return 400 if email or password validation fails (Zod)', async () => {
            mockRequest.body = { email: 'invalid-email', password: '' };

            await authController.login(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                data: null
            }));
        });

        it('should return 401 if login fails (invalid credentials)', async () => {
            mockRequest.body = { email: 'test@test.com', password: 'password123' };
            mockAuthService.login.mockResolvedValue(null);

            await authController.login(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid credentials',
                data: null
            });
        });

        it('should set HttpOnly cookie and return 200 on successful login', async () => {
            mockRequest.body = { email: 'test@test.com', password: 'password123' };
            const mockResult = {
                token: 'mock-jwt-token',
                user: { id: 1, email: 'test@test.com', name: 'Test User', role: 'user' }
            };
            mockAuthService.login.mockResolvedValue(mockResult);

            await authController.login(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.cookie).toHaveBeenCalledWith('token', 'mock-jwt-token', expect.objectContaining({
                httpOnly: true,
                sameSite: 'strict',
            }));
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Login successful',
                data: { user: mockResult.user }
            });
        });
    });

    describe('Google Login', () => {
        it('should return 400 if idToken is missing (Zod)', async () => {
            mockRequest.body = {};

            await authController.googleLogin(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                data: null
            }));
        });

        it('should return 401 if Google login verification fails', async () => {
            mockRequest.body = { idToken: 'invalid-token' };
            mockAuthService.loginWithGoogle.mockResolvedValue(null);

            await authController.googleLogin(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid Google token',
                data: null
            });
        });

        it('should set HttpOnly cookie and return 200 on successful Google login', async () => {
            mockRequest.body = { idToken: 'valid-token' };
            const mockResult = {
                token: 'google-jwt-token',
                user: { id: 2, email: 'google@test.com', name: 'Google User', role: 'user' }
            };
            mockAuthService.loginWithGoogle.mockResolvedValue(mockResult);

            await authController.googleLogin(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.cookie).toHaveBeenCalledWith('token', 'google-jwt-token', expect.objectContaining({
                httpOnly: true,
                sameSite: 'strict',
            }));
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Google login successful',
                data: { user: mockResult.user }
            });
        });
    });

    describe('Logout', () => {
        it('should clear token cookie and return success message', async () => {
            await authController.logout(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.clearCookie).toHaveBeenCalledWith('token', expect.objectContaining({
                httpOnly: true,
                sameSite: 'strict',
            }));
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Logged out successfully',
                data: null
            });
        });
    });

    describe('Get Me', () => {
        it('should return 401 if user property is missing in request', async () => {
            mockRequest.user = undefined;

            await authController.getMe(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not authenticated',
                data: null
            });
        });

        it('should return user details and 200 if user is present in request', async () => {
            const mockUser = { id: 1, email: 'test@test.com', name: 'Test User', role: 'user' };
            mockRequest.user = mockUser;

            await authController.getMe(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'User retrieved successfully',
                data: { user: mockUser }
            });
        });
    });
});

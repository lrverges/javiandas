import { requireAuth } from './authMiddleware';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SequelizeUserRepository } from '../../infrastructure/repositories/SequelizeUserRepository';
import { AppError } from './errorHandler';

jest.mock('jsonwebtoken');
jest.mock('../../infrastructure/repositories/SequelizeUserRepository');

describe('requireAuth Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            cookies: {},
        };
        mockResponse = {};
        nextFunction = jest.fn();
        process.env.JWT_SECRET = 'test-secret';
    });

    afterEach(() => {
        delete process.env.JWT_SECRET;
        jest.clearAllMocks();
    });

    it('should call next with AppError(401) if token cookie is missing', async () => {
        await requireAuth(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
        const error = (nextFunction as jest.Mock).mock.calls[0][0];
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Not authenticated');
    });

    it('should call next with AppError(500) if JWT_SECRET is missing', async () => {
        delete process.env.JWT_SECRET;
        mockRequest.cookies = { token: 'mock-token' };

        await requireAuth(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
        const error = (nextFunction as jest.Mock).mock.calls[0][0];
        expect(error.statusCode).toBe(500);
        expect(error.message).toBe('Internal Server Error');
    });

    it('should call next with AppError(401) if token verification fails', async () => {
        mockRequest.cookies = { token: 'invalid-token' };
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error('Invalid token');
        });

        await requireAuth(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
        const error = (nextFunction as jest.Mock).mock.calls[0][0];
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Invalid or expired token');
    });

    it('should call next with AppError(401) if user no longer exists in DB', async () => {
        mockRequest.cookies = { token: 'valid-token' };
        (jwt.verify as jest.Mock).mockReturnValue({ userId: 1, email: 'user@test.com' });
        (SequelizeUserRepository.prototype.findByEmail as jest.Mock).mockResolvedValue(null);

        await requireAuth(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
        const error = (nextFunction as jest.Mock).mock.calls[0][0];
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('User no longer exists');
    });

    it('should set req.user and call next() on successful authentication', async () => {
        mockRequest.cookies = { token: 'valid-token' };
        (jwt.verify as jest.Mock).mockReturnValue({ userId: 1, email: 'user@test.com' });
        (SequelizeUserRepository.prototype.findByEmail as jest.Mock).mockResolvedValue({
            id: 1,
            email: 'user@test.com',
            name: 'Test User',
            role: 'user',
        });

        await requireAuth(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(SequelizeUserRepository.prototype.findByEmail).toHaveBeenCalledWith('user@test.com');
        expect(mockRequest.user).toEqual({
            id: 1,
            email: 'user@test.com',
            name: 'Test User',
            role: 'user',
        });
        expect(nextFunction).toHaveBeenCalledWith(); // called with no arguments, meaning success
    });
});

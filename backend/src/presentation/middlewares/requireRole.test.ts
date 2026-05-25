import { requireRole, requireCompanyAccess } from './requireRole';
import { AppError } from './errorHandler';
import { Request, Response, NextFunction } from 'express';

describe('requireRole Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {};
        nextFunction = jest.fn();
    });

    it('should call next with 401 AppError if user is not present on request', () => {
        const middleware = requireRole('admin_javiandas');

        middleware(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith(
            expect.any(AppError)
        );
        const error = (nextFunction as jest.Mock).mock.calls[0][0];
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('No autenticado');
    });

    it('should call next with 403 AppError if user role is not allowed', () => {
        const middleware = requireRole('admin_javiandas');
        (mockRequest as any).user = { id: 1, email: 'user@test.com', role: 'user' };

        middleware(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith(
            expect.any(AppError)
        );
        const error = (nextFunction as jest.Mock).mock.calls[0][0];
        expect(error.statusCode).toBe(403);
        expect(error.message).toBe('Acceso denegado: privilegios insuficientes');
    });

    it('should call next without arguments if user role is allowed', () => {
        const middleware = requireRole('admin_javiandas', 'admin_empresa');
        (mockRequest as any).user = { id: 1, email: 'admin@acme.com', role: 'admin_empresa' };

        middleware(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith();
        expect(nextFunction).not.toHaveBeenCalledWith(expect.any(Error));
    });
});

describe('requireCompanyAccess Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {};
        nextFunction = jest.fn();
    });

    it('should call next with 401 AppError if user is not present', () => {
        requireCompanyAccess(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
        const error = (nextFunction as jest.Mock).mock.calls[0][0];
        expect(error.statusCode).toBe(401);
    });

    it('should call next if user is admin_javiandas', () => {
        (mockRequest as any).user = { id: 1, email: 'admin@javiandas.com', role: 'admin_javiandas' };
        mockRequest.params = { id: '1' };

        requireCompanyAccess(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith();
        expect(nextFunction).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call next if user is admin_empresa and companyId matches params id', () => {
        (mockRequest as any).user = { id: 2, email: 'admin@company.com', role: 'admin_empresa', companyId: 1 };
        mockRequest.params = { id: '1' };

        requireCompanyAccess(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith();
        expect(nextFunction).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call next with 403 AppError if user is admin_empresa but companyId does not match params id', () => {
        (mockRequest as any).user = { id: 2, email: 'admin@company.com', role: 'admin_empresa', companyId: 2 };
        mockRequest.params = { id: '1' };

        requireCompanyAccess(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
        const error = (nextFunction as jest.Mock).mock.calls[0][0];
        expect(error.statusCode).toBe(403);
    });

    it('should call next with 403 AppError if user role is not allowed (e.g. user)', () => {
        (mockRequest as any).user = { id: 3, email: 'user@test.com', role: 'user' };
        mockRequest.params = { id: '1' };

        requireCompanyAccess(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
        const error = (nextFunction as jest.Mock).mock.calls[0][0];
        expect(error.statusCode).toBe(403);
    });
});


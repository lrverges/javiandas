import { CompanyController } from './companyController';
import { Request, Response, NextFunction } from 'express';
import { Company } from '../../domain/models/Company';
import { CompanyAdmin } from '../../domain/models/CompanyAdmin';

describe('CompanyController', () => {
    let companyController: CompanyController;
    let mockCompanyService: any;
    let mockAdminService: any;
    let mockEmployeeService: any;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockCompanyService = {
            createCompany: jest.fn(),
            listCompanies: jest.fn(),
            getCompanyDetail: jest.fn(),
            updateCompany: jest.fn(),
        };

        mockAdminService = {
            assignAdmin: jest.fn(),
            removeAdmin: jest.fn(),
        };

        mockEmployeeService = {
            batchCreateEmployees: jest.fn(),
            removeEmployee: jest.fn(),
        };

        companyController = new CompanyController(
            mockCompanyService,
            mockAdminService,
            mockEmployeeService
        );

        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        nextFunction = jest.fn();
    });

    describe('createCompany', () => {
        it('should return 201 and the created company with valid data', async () => {
            const body = {
                name: 'ACME',
                cuit: '30-12345678-9',
                street: 'San Martin',
                addressNumber: '123',
                locality: 'Lules',
                benefitType: 'Corporativo',
                allowExtraAddresses: false
            };
            mockRequest.body = body;

            const expectedResult = new Company({ ...body, id: 1 });
            mockCompanyService.createCompany.mockResolvedValue(expectedResult);

            await companyController.createCompany(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Empresa creada exitosamente',
                data: expectedResult
            });
        });

        it('should return 400 with invalid CUIT pattern', async () => {
            mockRequest.body = {
                name: 'ACME',
                cuit: 'invalid-cuit',
                street: 'San Martin',
                addressNumber: '123',
                locality: 'Lules',
                benefitType: 'Corporativo',
                allowExtraAddresses: false
            };

            await companyController.createCompany(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'CUIT inválido. Debe ser XX-XXXXXXXX-X'
            }));
        });
    });

    describe('assignAdmin', () => {
        it('should return 201 and admin assign details', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = { email: 'admin@acme.com' };

            const expectedAdmin = new CompanyAdmin({ companyId: 1, email: 'admin@acme.com', status: 'active' });
            mockAdminService.assignAdmin.mockResolvedValue(expectedAdmin);

            await companyController.assignAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Administrador asignado exitosamente',
                data: expectedAdmin
            });
        });

        it('should return 400 for invalid email format', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = { email: 'not-an-email' };

            await companyController.assignAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Formato de email inválido'
            }));
        });
    });

    describe('batchEmployees', () => {
        it('should return 200 and batch process summary', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = { emails: ['emp1@acme.com', 'emp2@acme.com'] };

            const mockBatchResult = {
                added: ['emp1@acme.com', 'emp2@acme.com'],
                errors: [],
                summary: { total: 2, successful: 2, failed: 0 }
            };
            mockEmployeeService.batchCreateEmployees.mockResolvedValue(mockBatchResult);

            await companyController.batchEmployees(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Procesamiento de carga masiva finalizado',
                data: mockBatchResult
            });
        });
    });
});

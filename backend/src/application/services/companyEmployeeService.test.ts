import { CompanyEmployeeService } from './companyEmployeeService';
import { ICompanyEmployeeRepository } from '../../domain/repositories/ICompanyEmployeeRepository';
import { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import { Company } from '../../domain/models/Company';
import { CompanyEmployee } from '../../domain/models/CompanyEmployee';
import { AppError } from '../../presentation/middlewares/errorHandler';

describe('CompanyEmployeeService', () => {
    let companyEmployeeService: CompanyEmployeeService;
    let mockEmployeeRepo: jest.Mocked<ICompanyEmployeeRepository>;
    let mockCompanyRepo: jest.Mocked<ICompanyRepository>;

    beforeEach(() => {
        mockEmployeeRepo = {
            create: jest.fn(),
            batchCreate: jest.fn(),
            remove: jest.fn(),
            findByCompanyId: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
        } as any;

        mockCompanyRepo = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            findByCuit: jest.fn(),
        } as any;

        companyEmployeeService = new CompanyEmployeeService(mockEmployeeRepo, mockCompanyRepo);
    });

    describe('batchCreateEmployees', () => {
        it('should successfully batch create all valid and unique employees', async () => {
            const mockCompany = new Company({
                id: 1, name: 'ACME', cuit: '30-12345678-9', street: 'San Martin',
                addressNumber: '123', locality: 'Lules', benefitType: 'Corporativo', allowExtraAddresses: false
            });

            mockCompanyRepo.findById.mockResolvedValue(mockCompany);
            mockEmployeeRepo.findByEmail.mockResolvedValue(null);
            mockEmployeeRepo.batchCreate.mockResolvedValue([]);

            const emails = ['emp1@acme.com', 'emp2@acme.com'];
            const result = await companyEmployeeService.batchCreateEmployees(1, emails);

            expect(result.added).toEqual(['emp1@acme.com', 'emp2@acme.com']);
            expect(result.errors).toEqual([]);
            expect(result.summary).toEqual({ total: 2, successful: 2, failed: 0 });
            expect(mockEmployeeRepo.create).toHaveBeenCalledTimes(2);
            expect(mockEmployeeRepo.create).toHaveBeenNthCalledWith(1, expect.objectContaining({ email: 'emp1@acme.com', companyId: 1, status: 'pending' }));
            expect(mockEmployeeRepo.create).toHaveBeenNthCalledWith(2, expect.objectContaining({ email: 'emp2@acme.com', companyId: 1, status: 'pending' }));
        });

        it('should return partial errors for request duplicates, invalid formats, and cross-company duplicates', async () => {
            const mockCompany = new Company({
                id: 1, name: 'ACME', cuit: '30-12345678-9', street: 'San Martin',
                addressNumber: '123', locality: 'Lules', benefitType: 'Corporativo', allowExtraAddresses: false
            });

            mockCompanyRepo.findById.mockResolvedValue(mockCompany);

            // emp-other@acme.com ya pertenece a otra empresa (id 2)
            mockEmployeeRepo.findByEmail.mockImplementation(async (email) => {
                if (email === 'emp-other@acme.com') {
                    return new CompanyEmployee({ id: 5, companyId: 2, email: 'emp-other@acme.com' });
                }
                return null;
            });

            const emails = [
                'valid1@acme.com',
                'invalid-email',
                'valid1@acme.com', // duplicado en request
                'emp-other@acme.com' // de otra empresa
            ];

            const result = await companyEmployeeService.batchCreateEmployees(1, emails);

            expect(result.added).toEqual(['valid1@acme.com']);
            expect(result.errors).toEqual([
                { email: 'invalid-email', reason: 'Formato de email inválido' },
                { email: 'valid1@acme.com', reason: 'Email duplicado en esta solicitud' },
                { email: 'emp-other@acme.com', reason: 'Email ya está asignado a otra empresa' }
            ]);
            expect(result.summary).toEqual({ total: 4, successful: 1, failed: 3 });
        });

        it('should handle same-company pre-assignment idempotently without error', async () => {
            const mockCompany = new Company({
                id: 1, name: 'ACME', cuit: '30-12345678-9', street: 'San Martin',
                addressNumber: '123', locality: 'Lules', benefitType: 'Corporativo', allowExtraAddresses: false
            });

            mockCompanyRepo.findById.mockResolvedValue(mockCompany);

            // ya asignado en la misma empresa (id 1)
            mockEmployeeRepo.findByEmail.mockResolvedValue(new CompanyEmployee({ id: 6, companyId: 1, email: 'already@acme.com' }));

            const emails = ['already@acme.com'];
            const result = await companyEmployeeService.batchCreateEmployees(1, emails);

            expect(result.added).toEqual([]);
            expect(result.errors).toEqual([]); // sin error!
            expect(result.summary).toEqual({ total: 1, successful: 0, failed: 0 });
            expect(mockEmployeeRepo.batchCreate).not.toHaveBeenCalled();
        });
    });

    describe('removeEmployee', () => {
        it('should successfully remove employee if status is pending', async () => {
            const employee = new CompanyEmployee({ id: 5, companyId: 1, email: 'test@acme.com', status: 'pending' });
            mockEmployeeRepo.findById.mockResolvedValue(employee);
            mockEmployeeRepo.remove.mockResolvedValue(true);

            const result = await companyEmployeeService.removeEmployee(1, 5);

            expect(result).toBe(true);
            expect(mockEmployeeRepo.remove).toHaveBeenCalledWith(1, 5);
        });

        it('should throw 409 AppError if employee status is registered', async () => {
            const employee = new CompanyEmployee({ id: 5, companyId: 1, email: 'test@acme.com', status: 'registered' });
            mockEmployeeRepo.findById.mockResolvedValue(employee);

            await expect(companyEmployeeService.removeEmployee(1, 5)).rejects.toThrow(
                new AppError('No se puede eliminar un empleado que ya se registró en la plataforma', 409)
            );
            expect(mockEmployeeRepo.remove).not.toHaveBeenCalled();
        });
    });
});

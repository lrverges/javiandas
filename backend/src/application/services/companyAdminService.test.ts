import { CompanyAdminService } from './companyAdminService';
import { ICompanyAdminRepository } from '../../domain/repositories/ICompanyAdminRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import { Company } from '../../domain/models/Company';
import { CompanyAdmin } from '../../domain/models/CompanyAdmin';
import { User } from '../../domain/models/User';
import { AppError } from '../../presentation/middlewares/errorHandler';

jest.mock('../../infrastructure/database/sequelize', () => ({
    sequelize: {
        transaction: jest.fn().mockResolvedValue({
            commit: jest.fn(),
            rollback: jest.fn(),
        }),
    },
}));

describe('CompanyAdminService', () => {
    let companyAdminService: CompanyAdminService;
    let mockAdminRepo: jest.Mocked<ICompanyAdminRepository>;
    let mockUserRepo: jest.Mocked<IUserRepository>;
    let mockCompanyRepo: jest.Mocked<ICompanyRepository>;

    beforeEach(() => {
        mockAdminRepo = {
            assign: jest.fn(),
            remove: jest.fn(),
            findByCompanyId: jest.fn(),
            findByEmail: jest.fn(),
        } as any;

        mockUserRepo = {
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        } as any;

        mockCompanyRepo = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            findByCuit: jest.fn(),
        } as any;

        companyAdminService = new CompanyAdminService(mockAdminRepo, mockUserRepo, mockCompanyRepo);
    });

    describe('assignAdmin', () => {
        it('should assign a registered user as admin (active status) and update user model', async () => {
            const mockCompany = new Company({
                id: 1, name: 'ACME', cuit: '30-12345678-9', street: 'San Martin',
                addressNumber: '123', locality: 'Lules', benefitType: 'Corporativo', allowExtraAddresses: false
            });
            const mockUser = new User({ id: 10, email: 'admin@acme.com', name: 'Admin User', role: 'user' });
            
            mockCompanyRepo.findById.mockResolvedValue(mockCompany);
            mockAdminRepo.findByEmail.mockResolvedValue(null);
            mockUserRepo.findByEmail.mockResolvedValue(mockUser);
            
            const expectedAdmin = new CompanyAdmin({ companyId: 1, userId: 10, email: 'admin@acme.com', status: 'active' });
            mockAdminRepo.assign.mockResolvedValue(expectedAdmin);

            const result = await companyAdminService.assignAdmin(1, 'admin@acme.com');

            expect(result).toEqual(expectedAdmin);
            expect(mockUserRepo.update).toHaveBeenCalledWith(10, { role: 'admin_empresa', companyId: 1 }, expect.any(Object));
            expect(mockAdminRepo.assign).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }), expect.any(Object));
        });

        it('should pre-assign a non-registered email as admin (pending status)', async () => {
            const mockCompany = new Company({
                id: 1, name: 'ACME', cuit: '30-12345678-9', street: 'San Martin',
                addressNumber: '123', locality: 'Lules', benefitType: 'Corporativo', allowExtraAddresses: false
            });

            mockCompanyRepo.findById.mockResolvedValue(mockCompany);
            mockAdminRepo.findByEmail.mockResolvedValue(null);
            mockUserRepo.findByEmail.mockResolvedValue(null); // not registered

            const expectedAdmin = new CompanyAdmin({ companyId: 1, userId: null, email: 'pending@acme.com', status: 'pending' });
            mockAdminRepo.assign.mockResolvedValue(expectedAdmin);

            const result = await companyAdminService.assignAdmin(1, 'pending@acme.com');

            expect(result).toEqual(expectedAdmin);
            expect(mockUserRepo.update).not.toHaveBeenCalled();
            expect(mockAdminRepo.assign).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending', userId: null }));
        });

        it('should throw 409 AppError if admin already assigned to this company', async () => {
            const mockCompany = new Company({
                id: 1, name: 'ACME', cuit: '30-12345678-9', street: 'San Martin',
                addressNumber: '123', locality: 'Lules', benefitType: 'Corporativo', allowExtraAddresses: false
            });

            mockCompanyRepo.findById.mockResolvedValue(mockCompany);
            mockAdminRepo.findByEmail.mockResolvedValue(new CompanyAdmin({ companyId: 1, email: 'admin@acme.com' }));

            await expect(companyAdminService.assignAdmin(1, 'admin@acme.com')).rejects.toThrow(
                new AppError('Este email ya es administrador de esta empresa', 409)
            );
        });

        it('should throw 404 AppError if company not found', async () => {
            mockCompanyRepo.findById.mockResolvedValue(null);

            await expect(companyAdminService.assignAdmin(99, 'admin@acme.com')).rejects.toThrow(
                new AppError('Empresa no encontrada', 404)
            );
        });
    });

    describe('removeAdmin', () => {
        it('should successfully remove active admin and revert user role/companyId', async () => {
            const existingAdmins = [
                new CompanyAdmin({ id: 5, companyId: 1, userId: 10, email: 'admin@acme.com', status: 'active' })
            ];
            mockAdminRepo.findByCompanyId.mockResolvedValue(existingAdmins);
            mockAdminRepo.remove.mockResolvedValue(true);

            const result = await companyAdminService.removeAdmin(1, 5);

            expect(result).toBe(true);
            expect(mockAdminRepo.remove).toHaveBeenCalledWith(1, 5, expect.any(Object));
            expect(mockUserRepo.update).toHaveBeenCalledWith(10, { role: 'user', companyId: null }, expect.any(Object));
        });

        it('should throw 404 AppError if admin not found in company', async () => {
            mockAdminRepo.findByCompanyId.mockResolvedValue([]);

            await expect(companyAdminService.removeAdmin(1, 99)).rejects.toThrow(
                new AppError('Administrador no encontrado', 404)
            );
        });
    });
});

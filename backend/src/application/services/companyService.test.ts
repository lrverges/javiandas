import { CompanyService } from './companyService';
import { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import { Company } from '../../domain/models/Company';
import { AppError } from '../../presentation/middlewares/errorHandler';

describe('CompanyService', () => {
    let companyService: CompanyService;
    let mockCompanyRepository: jest.Mocked<ICompanyRepository>;

    beforeEach(() => {
        mockCompanyRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            findByCuit: jest.fn(),
        } as any;

        companyService = new CompanyService(mockCompanyRepository);
    });

    describe('createCompany', () => {
        it('should successfully create a company with valid inputs', async () => {
            const input = {
                name: 'ACME S.A.',
                cuit: '30-12345678-9',
                street: 'San Martin',
                addressNumber: '123',
                locality: 'Lules',
                benefitType: 'Corporativo Premium',
                allowExtraAddresses: false
            };

            const mockCreated = new Company({ ...input, id: 1, isActive: true });
            mockCompanyRepository.findByCuit.mockResolvedValue(null);
            mockCompanyRepository.create.mockResolvedValue(mockCreated);

            const result = await companyService.createCompany(input);

            expect(result).toEqual(mockCreated);
            expect(mockCompanyRepository.findByCuit).toHaveBeenCalledWith('30-12345678-9');
            expect(mockCompanyRepository.create).toHaveBeenCalled();
        });

        it('should throw AppError 400 if CUIT is invalid format', async () => {
            const input = {
                name: 'ACME S.A.',
                cuit: '30123456789', // sin guiones
                street: 'San Martin',
                addressNumber: '123',
                locality: 'Lules',
                benefitType: 'Corporativo Premium',
                allowExtraAddresses: false
            };

            await expect(companyService.createCompany(input)).rejects.toThrow(
                new AppError('El formato de CUIT debe ser XX-XXXXXXXX-X', 400)
            );
            expect(mockCompanyRepository.create).not.toHaveBeenCalled();
        });

        it('should throw AppError 409 if CUIT already exists', async () => {
            const input = {
                name: 'ACME S.A.',
                cuit: '30-12345678-9',
                street: 'San Martin',
                addressNumber: '123',
                locality: 'Lules',
                benefitType: 'Corporativo Premium',
                allowExtraAddresses: false
            };

            mockCompanyRepository.findByCuit.mockResolvedValue(new Company({ ...input, id: 2 }));

            await expect(companyService.createCompany(input)).rejects.toThrow(
                new AppError('Ya existe una empresa con el CUIT 30-12345678-9', 409)
            );
            expect(mockCompanyRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('getCompanyDetail', () => {
        it('should return company if found', async () => {
            const mockCompany = new Company({
                id: 1,
                name: 'ACME S.A.',
                cuit: '30-12345678-9',
                street: 'San Martin',
                addressNumber: '123',
                locality: 'Lules',
                benefitType: 'Corporativo Premium',
                allowExtraAddresses: false
            });

            mockCompanyRepository.findById.mockResolvedValue(mockCompany);

            const result = await companyService.getCompanyDetail(1);
            expect(result).toEqual(mockCompany);
        });

        it('should throw 404 AppError if company not found', async () => {
            mockCompanyRepository.findById.mockResolvedValue(null);

            await expect(companyService.getCompanyDetail(99)).rejects.toThrow(
                new AppError('Empresa no encontrada', 404)
            );
        });
    });

    describe('updateCompany', () => {
        it('should successfully update company and ignore CUIT field', async () => {
            const existing = new Company({
                id: 1,
                name: 'ACME S.A.',
                cuit: '30-12345678-9',
                street: 'San Martin',
                addressNumber: '123',
                locality: 'Lules',
                benefitType: 'Corporativo Premium',
                allowExtraAddresses: false
            });

            mockCompanyRepository.findById.mockResolvedValue(existing);
            mockCompanyRepository.update.mockResolvedValue(new Company({ ...existing, name: 'ACME UPDATED' }));

            const result = await companyService.updateCompany(1, {
                name: 'ACME UPDATED',
                cuit: '30-88888888-8' // intento de cambio
            });

            expect(result.name).toBe('ACME UPDATED');
            // Cuit se ignora y se llama a update con name, sin cuit
            expect(mockCompanyRepository.update).toHaveBeenCalledWith(1, { name: 'ACME UPDATED' });
        });

        it('should throw 404 if company to update does not exist', async () => {
            mockCompanyRepository.findById.mockResolvedValue(null);

            await expect(companyService.updateCompany(99, { name: 'ACME' })).rejects.toThrow(
                new AppError('Empresa no encontrada', 404)
            );
        });
    });
});

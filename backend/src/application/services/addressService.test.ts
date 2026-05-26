import { AddressService } from './addressService';
import { IAddressRepository } from '../../domain/repositories/IAddressRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import { Address } from '../../domain/models/Address';
import { User } from '../../domain/models/User';
import { Company } from '../../domain/models/Company';
import { AppError } from '../../presentation/middlewares/errorHandler';

describe('AddressService', () => {
    let addressService: AddressService;
    let mockAddressRepository: jest.Mocked<IAddressRepository>;
    let mockUserRepository: jest.Mocked<IUserRepository>;
    let mockCompanyRepository: jest.Mocked<ICompanyRepository>;
    let mockSequelize: any;
    let mockTransaction: any;

    beforeEach(() => {
        mockAddressRepository = {
            create: jest.fn(),
            findByUserId: jest.fn(),
            findDefaultByUserId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            clearDefaultByUserId: jest.fn(),
            findById: jest.fn(),
        } as any;

        mockUserRepository = {
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
        } as any;

        mockCompanyRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            findByCuit: jest.fn(),
        } as any;

        mockTransaction = {
            commit: jest.fn(),
            rollback: jest.fn(),
        };

        mockSequelize = {
            transaction: jest.fn().mockResolvedValue(mockTransaction),
        };

        addressService = new AddressService(
            mockAddressRepository,
            mockUserRepository,
            mockCompanyRepository,
            mockSequelize
        );
    });

    describe('listAddresses', () => {
        it('should return empty list when user has no addresses', async () => {
            mockAddressRepository.findByUserId.mockResolvedValue([]);
            const result = await addressService.listAddresses(1);
            expect(result).toEqual([]);
            expect(mockAddressRepository.findByUserId).toHaveBeenCalledWith(1);
        });

        it('should return list of addresses', async () => {
            const addresses = [
                new Address({ id: 1, userId: 1, street: 'Calle 1', number: '123', locality: 'Lules', isDefault: true })
            ];
            mockAddressRepository.findByUserId.mockResolvedValue(addresses);
            const result = await addressService.listAddresses(1);
            expect(result).toEqual(addresses);
        });
    });

    describe('createAddress', () => {
        const addressData = { street: 'Calle 2', number: '456', locality: 'Yerba Buena', reference: 'Casa' };

        it('should create address as default when user has no prior addresses', async () => {
            mockUserRepository.findById.mockResolvedValue(new User({ id: 1, email: 'user@test.com', name: 'User' }));
            mockAddressRepository.findByUserId.mockResolvedValue([]);
            
            const expectedAddress = new Address({ ...addressData, userId: 1, isDefault: true });
            mockAddressRepository.create.mockResolvedValue({ ...expectedAddress, id: 2 });

            const result = await addressService.createAddress(1, addressData);

            expect(result.isDefault).toBe(true);
            expect(mockAddressRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 1, street: 'Calle 2', isDefault: true })
            );
        });

        it('should create address as non-default when user already has addresses', async () => {
            mockUserRepository.findById.mockResolvedValue(new User({ id: 1, email: 'user@test.com', name: 'User' }));
            mockAddressRepository.findByUserId.mockResolvedValue([
                new Address({ id: 1, userId: 1, street: 'Calle 1', number: '123', locality: 'Lules', isDefault: true })
            ]);

            const expectedAddress = new Address({ ...addressData, userId: 1, isDefault: false });
            mockAddressRepository.create.mockResolvedValue({ ...expectedAddress, id: 2 });

            const result = await addressService.createAddress(1, addressData);

            expect(result.isDefault).toBe(false);
            expect(mockAddressRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 1, street: 'Calle 2', isDefault: false })
            );
        });

        it('should fail with 403 for corporate user when extra addresses are restricted', async () => {
            const corpUser = new User({ id: 1, email: 'corp@test.com', name: 'Corp', companyId: 10 });
            mockUserRepository.findById.mockResolvedValue(corpUser);
            
            const company = new Company({ id: 10, name: 'ACME', cuit: '30-12345678-9', street: 'S', addressNumber: '1', locality: 'L', benefitType: 'Corp', allowExtraAddresses: false });
            mockCompanyRepository.findById.mockResolvedValue(company);

            await expect(addressService.createAddress(1, addressData)).rejects.toThrow(
                new AppError('Su cuenta corporativa no permite registrar direcciones de entrega adicionales.', 403)
            );
        });

        it('should succeed for corporate user when company allows extra addresses', async () => {
            const corpUser = new User({ id: 1, email: 'corp@test.com', name: 'Corp', companyId: 10 });
            mockUserRepository.findById.mockResolvedValue(corpUser);
            
            const company = new Company({ id: 10, name: 'ACME', cuit: '30-12345678-9', street: 'S', addressNumber: '1', locality: 'L', benefitType: 'Corp', allowExtraAddresses: true });
            mockCompanyRepository.findById.mockResolvedValue(company);
            mockAddressRepository.findByUserId.mockResolvedValue([
                new Address({ id: 1, userId: 1, street: 'Company St', number: '1', locality: 'L', isDefault: true })
            ]);

            const expectedAddress = new Address({ ...addressData, userId: 1, isDefault: false });
            mockAddressRepository.create.mockResolvedValue({ ...expectedAddress, id: 2 });

            const result = await addressService.createAddress(1, addressData);

            expect(result).toBeDefined();
            expect(mockAddressRepository.create).toHaveBeenCalled();
        });
    });

    describe('updateAddress', () => {
        const updateData = { street: 'Calle Modificada', number: '789', locality: 'Tucuman' };

        it('should update address details when user is the owner', async () => {
            const existingAddress = new Address({ id: 2, userId: 1, street: 'Calle 2', number: '456', locality: 'Yerba Buena', isDefault: false });
            mockAddressRepository.findById.mockResolvedValue(existingAddress);

            mockAddressRepository.update.mockResolvedValue(new Address({ ...existingAddress, ...updateData }));

            const result = await addressService.updateAddress(1, 2, updateData);

            expect(mockAddressRepository.update).toHaveBeenCalledWith(2, expect.objectContaining(updateData));
        });

        it('should ignore isDefault field passed in update data', async () => {
            const existingAddress = new Address({ id: 2, userId: 1, street: 'Calle 2', number: '456', locality: 'Yerba Buena', isDefault: false });
            mockAddressRepository.findById.mockResolvedValue(existingAddress);
            mockAddressRepository.update.mockResolvedValue(existingAddress);

            await addressService.updateAddress(1, 2, { ...updateData, isDefault: true } as any);

            expect(mockAddressRepository.update).toHaveBeenCalledWith(2, expect.not.objectContaining({ isDefault: true }));
        });

        it('should throw 404 AppError if address does not exist or user is not the owner', async () => {
            mockAddressRepository.findById.mockResolvedValue(null);

            await expect(addressService.updateAddress(1, 99, updateData)).rejects.toThrow(
                new AppError('Dirección no encontrada', 404)
            );
        });

        it('should throw 404 AppError if user does not own the address', async () => {
            const existingAddress = new Address({ id: 2, userId: 99, street: 'Calle 2', number: '456', locality: 'Yerba Buena', isDefault: false });
            mockAddressRepository.findById.mockResolvedValue(existingAddress);

            await expect(addressService.updateAddress(1, 2, updateData)).rejects.toThrow(
                new AppError('Dirección no encontrada', 404)
            );
        });
    });

    describe('deleteAddress', () => {
        it('should delete non-default address successfully', async () => {
            const address = new Address({ id: 2, userId: 1, street: 'Calle 2', number: '456', locality: 'L', isDefault: false });
            mockAddressRepository.findById.mockResolvedValue(address);
            mockAddressRepository.delete.mockResolvedValue(true);

            await addressService.deleteAddress(1, 2);

            expect(mockAddressRepository.delete).toHaveBeenCalledWith(2);
        });

        it('should throw 400 AppError when trying to delete the only default address', async () => {
            const address = new Address({ id: 1, userId: 1, street: 'Calle 1', number: '123', locality: 'L', isDefault: true });
            mockAddressRepository.findById.mockResolvedValue(address);
            mockAddressRepository.findByUserId.mockResolvedValue([address]);

            await expect(addressService.deleteAddress(1, 1)).rejects.toThrow(
                new AppError('No puedes eliminar tu única dirección.', 400)
            );
        });

        it('should promote the oldest remaining address to default when default is deleted', async () => {
            const defaultAddress = new Address({ id: 1, userId: 1, street: 'Calle 1', number: '123', locality: 'L', isDefault: true });
            const backupAddress = new Address({ id: 2, userId: 1, street: 'Calle 2', number: '456', locality: 'L', isDefault: false });
            
            mockAddressRepository.findById.mockResolvedValue(defaultAddress);
            mockAddressRepository.findByUserId.mockResolvedValue([defaultAddress, backupAddress]);
            mockAddressRepository.delete.mockResolvedValue(true);

            await addressService.deleteAddress(1, 1);

            expect(mockAddressRepository.update).toHaveBeenCalledWith(2, { isDefault: true }, expect.any(Object));
            expect(mockAddressRepository.delete).toHaveBeenCalledWith(1, expect.any(Object));
        });

        it('should throw 404 AppError when address to delete does not exist', async () => {
            mockAddressRepository.findById.mockResolvedValue(null);

            await expect(addressService.deleteAddress(1, 99)).rejects.toThrow(
                new AppError('Dirección no encontrada', 404)
            );
        });
    });

    describe('setDefault', () => {
        it('should switch default address atomically', async () => {
            const address = new Address({ id: 2, userId: 1, street: 'Calle 2', number: '456', locality: 'L', isDefault: false });
            mockAddressRepository.findById.mockResolvedValue(address);

            await addressService.setDefault(1, 2);

            expect(mockAddressRepository.clearDefaultByUserId).toHaveBeenCalledWith(1, expect.any(Object));
            expect(mockAddressRepository.update).toHaveBeenCalledWith(2, { isDefault: true }, expect.any(Object));
            expect(mockTransaction.commit).toHaveBeenCalled();
        });

        it('should rollback transaction on error', async () => {
            const address = new Address({ id: 2, userId: 1, street: 'Calle 2', number: '456', locality: 'L', isDefault: false });
            mockAddressRepository.findById.mockResolvedValue(address);
            mockAddressRepository.update.mockRejectedValue(new Error('DB Error'));

            await expect(addressService.setDefault(1, 2)).rejects.toThrow('DB Error');

            expect(mockTransaction.rollback).toHaveBeenCalled();
        });

        it('should throw 404 AppError if address does not exist', async () => {
            mockAddressRepository.findById.mockResolvedValue(null);

            await expect(addressService.setDefault(1, 99)).rejects.toThrow(
                new AppError('Dirección no encontrada', 404)
            );
        });
    });
});

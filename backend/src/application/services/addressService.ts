import { IAddressRepository } from '../../domain/repositories/IAddressRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import { Address } from '../../domain/models/Address';
import { AppError } from '../../presentation/middlewares/errorHandler';

export class AddressService {
    constructor(
        private addressRepository: IAddressRepository,
        private userRepository: IUserRepository,
        private companyRepository: ICompanyRepository,
        private sequelizeInstance: any
    ) {}

    async listAddresses(userId: number): Promise<Address[]> {
        return this.addressRepository.findByUserId(userId);
    }

    async createAddress(userId: number, data: { street: string; number: string; locality: string; reference?: string }): Promise<Address> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new AppError('Usuario no encontrado', 404);
        }

        // Restricción corporativa
        if (user.companyId) {
            const company = await this.companyRepository.findById(user.companyId);
            if (company && !company.allowExtraAddresses) {
                throw new AppError('Su cuenta corporativa no permite registrar direcciones de entrega adicionales.', 403);
            }
        }

        const addresses = await this.addressRepository.findByUserId(userId);
        const isDefault = addresses.length === 0;

        const address = new Address({
            userId,
            street: data.street,
            number: data.number,
            locality: data.locality,
            reference: data.reference,
            isDefault
        });

        return this.addressRepository.create(address);
    }

    async updateAddress(
        userId: number,
        addressId: number,
        data: { street?: string; number?: string; locality?: string; reference?: string }
    ): Promise<Address | null> {
        const address = await this.addressRepository.findById(addressId);
        if (!address || address.userId !== userId) {
            throw new AppError('Dirección no encontrada', 404);
        }

        // Ignorar isDefault si se pasa
        const { isDefault, ...filteredData } = data as any;

        return this.addressRepository.update(addressId, filteredData);
    }

    async deleteAddress(userId: number, addressId: number): Promise<boolean> {
        const address = await this.addressRepository.findById(addressId);
        if (!address || address.userId !== userId) {
            throw new AppError('Dirección no encontrada', 404);
        }

        const allAddresses = await this.addressRepository.findByUserId(userId);

        if (address.isDefault) {
            if (allAddresses.length <= 1) {
                throw new AppError('No puedes eliminar tu única dirección.', 400);
            }

            // Promover la dirección más antigua restante
            const remainingAddresses = allAddresses.filter(a => a.id !== addressId);
            // Ordenar por ID para obtener la más antigua
            remainingAddresses.sort((a, b) => (a.id || 0) - (b.id || 0));
            const oldestAddress = remainingAddresses[0];

            const tx = await this.sequelizeInstance.transaction();
            try {
                await this.addressRepository.update(oldestAddress.id!, { isDefault: true }, { transaction: tx });
                const deleted = await this.addressRepository.delete(addressId, { transaction: tx });
                await tx.commit();
                return deleted;
            } catch (error) {
                await tx.rollback();
                throw error;
            }
        }

        return this.addressRepository.delete(addressId);
    }

    async setDefault(userId: number, addressId: number): Promise<Address | null> {
        const address = await this.addressRepository.findById(addressId);
        if (!address || address.userId !== userId) {
            throw new AppError('Dirección no encontrada', 404);
        }

        const tx = await this.sequelizeInstance.transaction();
        try {
            await this.addressRepository.clearDefaultByUserId(userId, { transaction: tx });
            const updated = await this.addressRepository.update(addressId, { isDefault: true }, { transaction: tx });
            await tx.commit();
            return updated;
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    }
}

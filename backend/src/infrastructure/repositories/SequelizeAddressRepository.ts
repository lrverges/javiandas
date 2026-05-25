import { Address } from '../../domain/models/Address';
import { IAddressRepository } from '../../domain/repositories/IAddressRepository';
import { AddressModel } from '../database/models/AddressModel';

export class SequelizeAddressRepository implements IAddressRepository {
    async create(address: Address, options?: { transaction?: any }): Promise<Address> {
        const created = await AddressModel.create({
            userId: address.userId,
            street: address.street,
            number: address.number,
            locality: address.locality,
            reference: address.reference || null,
            isDefault: address.isDefault,
        }, options);
        return new Address({
            id: created.id,
            userId: created.userId,
            street: created.street,
            number: created.number,
            locality: created.locality,
            reference: created.reference || undefined,
            isDefault: created.isDefault,
        });
    }

    async findByUserId(userId: number): Promise<Address[]> {
        const addresses = await AddressModel.findAll({ where: { userId } });
        return addresses.map(addr => new Address({
            id: addr.id,
            userId: addr.userId,
            street: addr.street,
            number: addr.number,
            locality: addr.locality,
            reference: addr.reference || undefined,
            isDefault: addr.isDefault,
        }));
    }

    async findDefaultByUserId(userId: number): Promise<Address | null> {
        const addr = await AddressModel.findOne({ where: { userId, isDefault: true } });
        if (!addr) return null;
        return new Address({
            id: addr.id,
            userId: addr.userId,
            street: addr.street,
            number: addr.number,
            locality: addr.locality,
            reference: addr.reference || undefined,
            isDefault: addr.isDefault,
        });
    }

    async update(id: number, address: Partial<Address>, options?: { transaction?: any }): Promise<Address | null> {
        const found = await AddressModel.findByPk(id, options);
        if (!found) return null;
        await found.update(address, options);
        return new Address({
            id: found.id,
            userId: found.userId,
            street: found.street,
            number: found.number,
            locality: found.locality,
            reference: found.reference || undefined,
            isDefault: found.isDefault,
        });
    }
}

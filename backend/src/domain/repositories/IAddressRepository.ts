import { Address } from '../models/Address';

export interface IAddressRepository {
    create(address: Address, options?: { transaction?: any }): Promise<Address>;
    findByUserId(userId: number): Promise<Address[]>;
    findDefaultByUserId(userId: number): Promise<Address | null>;
    update(id: number, address: Partial<Address>, options?: { transaction?: any }): Promise<Address | null>;
}

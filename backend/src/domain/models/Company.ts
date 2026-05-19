import { CompanyAdmin } from './CompanyAdmin';
import { CompanyEmployee } from './CompanyEmployee';

export class Company {
    id?: number;
    name: string;
    cuit: string;
    street: string;
    addressNumber: string;
    locality: string;
    benefitType: string; // 'Corporativo' | 'Corporativo Premium'
    allowExtraAddresses: boolean;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    admins?: CompanyAdmin[];
    employees?: CompanyEmployee[];

    constructor(data: {
        id?: number;
        name: string;
        cuit: string;
        street: string;
        addressNumber: string;
        locality: string;
        benefitType: string;
        allowExtraAddresses: boolean;
        isActive?: boolean;
        createdAt?: Date;
        updatedAt?: Date;
        admins?: CompanyAdmin[];
        employees?: CompanyEmployee[];
    }) {
        this.id = data.id;
        this.name = data.name;
        this.cuit = data.cuit;
        this.street = data.street;
        this.addressNumber = data.addressNumber;
        this.locality = data.locality;
        this.benefitType = data.benefitType;
        this.allowExtraAddresses = data.allowExtraAddresses;
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
        this.admins = data.admins || [];
        this.employees = data.employees || [];
    }
}

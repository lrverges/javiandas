import { Company } from '../../domain/models/Company';
import { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import { CompanyModel } from '../database/models/CompanyModel';
import { CompanyAdminModel } from '../database/models/CompanyAdminModel';
import { CompanyEmployeeModel } from '../database/models/CompanyEmployeeModel';
import { Op } from 'sequelize';

export class SequelizeCompanyRepository implements ICompanyRepository {
    async create(company: Company): Promise<Company> {
        const created = await CompanyModel.create({
            name: company.name,
            cuit: company.cuit,
            street: company.street,
            addressNumber: company.addressNumber,
            locality: company.locality,
            benefitType: company.benefitType,
            allowExtraAddresses: company.allowExtraAddresses,
            isActive: company.isActive,
        });
        return this.mapToDomain(created);
    }

    async findById(id: number): Promise<Company | null> {
        const found = await CompanyModel.findByPk(id, {
            include: [
                { model: CompanyAdminModel, as: 'admins' },
                { model: CompanyEmployeeModel, as: 'employees' }
            ]
        });
        if (!found) return null;
        return this.mapToDomain(found);
    }

    async findByCuit(cuit: string): Promise<Company | null> {
        const found = await CompanyModel.findOne({ where: { cuit } });
        if (!found) return null;
        return this.mapToDomain(found);
    }

    async findAll(options?: { page?: number; limit?: number; search?: string; benefitType?: string }): Promise<{ companies: Company[]; total: number }> {
        const page = options?.page || 1;
        const limit = options?.limit || 10;
        const search = options?.search || '';
        const benefitType = options?.benefitType || '';
        const offset = (page - 1) * limit;

        const where: any = {};
        if (search) {
            const escapedSearch = search.replace(/[%_]/g, '\\$&');
            where[Op.or] = [
                { name: { [Op.like]: `%${escapedSearch}%` } },
                { cuit: { [Op.like]: `%${escapedSearch}%` } }
            ];
        }
        if (benefitType) {
            where.benefitType = benefitType;
        }

        const { rows, count } = await CompanyModel.findAndCountAll({
            where,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });

        return {
            companies: rows.map(row => this.mapToDomain(row)),
            total: count
        };
    }

    async update(id: number, companyData: Partial<Company>): Promise<Company | null> {
        const found = await CompanyModel.findByPk(id);
        if (!found) return null;

        await found.update(companyData);
        return this.mapToDomain(found);
    }

    private mapToDomain(model: CompanyModel): Company {
        return new Company({
            id: model.id,
            name: model.name,
            cuit: model.cuit,
            street: model.street,
            addressNumber: model.addressNumber,
            locality: model.locality,
            benefitType: model.benefitType,
            allowExtraAddresses: model.allowExtraAddresses,
            isActive: model.isActive,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            admins: model.admins ? model.admins.map((a: any) => ({
                id: a.id,
                companyId: a.companyId,
                userId: a.userId,
                email: a.email,
                status: a.status,
                createdAt: a.createdAt,
                updatedAt: a.updatedAt
            })) : [],
            employees: model.employees ? model.employees.map((e: any) => ({
                id: e.id,
                companyId: e.companyId,
                email: e.email,
                userId: e.userId,
                status: e.status,
                createdAt: e.createdAt,
                updatedAt: e.updatedAt
            })) : []
        });
    }
}

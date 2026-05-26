import { Op } from 'sequelize';
import { CompanyAdmin } from '../../domain/models/CompanyAdmin';
import { ICompanyAdminRepository } from '../../domain/repositories/ICompanyAdminRepository';
import { CompanyAdminModel } from '../database/models/CompanyAdminModel';

export class SequelizeCompanyAdminRepository implements ICompanyAdminRepository {
    async assign(admin: CompanyAdmin, options?: { transaction?: any }): Promise<CompanyAdmin> {
        const created = await CompanyAdminModel.create({
            companyId: admin.companyId,
            userId: admin.userId,
            email: admin.email,
            status: admin.status,
        }, options);
        return this.mapToDomain(created);
    }

    async remove(companyId: number, adminId: number, options?: { transaction?: any }): Promise<boolean> {
        const deleted = await CompanyAdminModel.destroy({
            where: { companyId, id: adminId },
            ...options
        });
        return deleted > 0;
    }

    async findByCompanyId(companyId: number): Promise<CompanyAdmin[]> {
        const found = await CompanyAdminModel.findAll({
            where: { companyId, status: { [Op.ne]: 'inactive' } },
            order: [['createdAt', 'ASC']],
        });
        return found.map(item => this.mapToDomain(item));
    }

    async findByEmail(companyId: number, email: string): Promise<CompanyAdmin | null> {
        const found = await CompanyAdminModel.findOne({
            where: { companyId, email, status: { [Op.ne]: 'inactive' } }
        });
        if (!found) return null;
        return this.mapToDomain(found);
    }

    async findAnyPendingByEmail(email: string): Promise<CompanyAdmin | null> {
        const found = await CompanyAdminModel.findOne({
            where: { email, status: 'pending' }
        });
        if (!found) return null;
        return this.mapToDomain(found);
    }

    async findAnyByEmail(email: string): Promise<CompanyAdmin | null> {
        const found = await CompanyAdminModel.findOne({
            where: { email, status: { [Op.ne]: 'inactive' } }
        });
        if (!found) return null;
        return this.mapToDomain(found);
    }

    async update(id: number, admin: Partial<CompanyAdmin>, options?: { transaction?: any }): Promise<CompanyAdmin | null> {
        const found = await CompanyAdminModel.findByPk(id, options);
        if (!found) return null;
        await found.update(admin, options);
        return this.mapToDomain(found);
    }

    private mapToDomain(model: CompanyAdminModel): CompanyAdmin {
        return new CompanyAdmin({
            id: model.id,
            companyId: model.companyId,
            userId: model.userId,
            email: model.email,
            status: model.status as 'active' | 'pending' | 'inactive',
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        });
    }
}

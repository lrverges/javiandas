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
            where: { companyId },
            order: [['createdAt', 'ASC']],
        });
        return found.map(item => this.mapToDomain(item));
    }

    async findByEmail(companyId: number, email: string): Promise<CompanyAdmin | null> {
        const found = await CompanyAdminModel.findOne({
            where: { companyId, email }
        });
        if (!found) return null;
        return this.mapToDomain(found);
    }

    private mapToDomain(model: CompanyAdminModel): CompanyAdmin {
        return new CompanyAdmin({
            id: model.id,
            companyId: model.companyId,
            userId: model.userId,
            email: model.email,
            status: model.status as 'active' | 'pending',
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        });
    }
}

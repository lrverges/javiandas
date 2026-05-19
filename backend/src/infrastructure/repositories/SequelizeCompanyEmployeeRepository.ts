import { CompanyEmployee } from '../../domain/models/CompanyEmployee';
import { ICompanyEmployeeRepository } from '../../domain/repositories/ICompanyEmployeeRepository';
import { CompanyEmployeeModel } from '../database/models/CompanyEmployeeModel';
import { sequelize } from '../database/sequelize';

export class SequelizeCompanyEmployeeRepository implements ICompanyEmployeeRepository {
    async create(employee: CompanyEmployee): Promise<CompanyEmployee> {
        const created = await CompanyEmployeeModel.create({
            companyId: employee.companyId,
            email: employee.email,
            userId: employee.userId,
            status: employee.status,
        });
        return this.mapToDomain(created);
    }

    async batchCreate(employees: CompanyEmployee[]): Promise<CompanyEmployee[]> {
        const tx = await sequelize.transaction();
        try {
            const createdModels = [];
            for (const emp of employees) {
                const created = await CompanyEmployeeModel.create({
                    companyId: emp.companyId,
                    email: emp.email,
                    userId: emp.userId,
                    status: emp.status,
                }, { transaction: tx });
                createdModels.push(created);
            }
            await tx.commit();
            return createdModels.map(model => this.mapToDomain(model));
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    }

    async remove(companyId: number, employeeId: number): Promise<boolean> {
        const deleted = await CompanyEmployeeModel.destroy({
            where: { companyId, id: employeeId }
        });
        return deleted > 0;
    }

    async findByCompanyId(companyId: number): Promise<CompanyEmployee[]> {
        const found = await CompanyEmployeeModel.findAll({
            where: { companyId },
            order: [['createdAt', 'DESC']],
        });
        return found.map(item => this.mapToDomain(item));
    }

    async findByEmail(email: string): Promise<CompanyEmployee | null> {
        const found = await CompanyEmployeeModel.findOne({
            where: { email }
        });
        if (!found) return null;
        return this.mapToDomain(found);
    }

    async findById(id: number): Promise<CompanyEmployee | null> {
        const found = await CompanyEmployeeModel.findByPk(id);
        if (!found) return null;
        return this.mapToDomain(found);
    }

    private mapToDomain(model: CompanyEmployeeModel): CompanyEmployee {
        return new CompanyEmployee({
            id: model.id,
            companyId: model.companyId,
            email: model.email,
            userId: model.userId,
            status: model.status as 'pending' | 'registered',
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        });
    }
}

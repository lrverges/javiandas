import { CompanyAdmin } from '../models/CompanyAdmin';

export interface ICompanyAdminRepository {
    assign(admin: CompanyAdmin, options?: { transaction?: any }): Promise<CompanyAdmin>;
    remove(companyId: number, adminId: number, options?: { transaction?: any }): Promise<boolean>;
    findByCompanyId(companyId: number): Promise<CompanyAdmin[]>;
    findByEmail(companyId: number, email: string): Promise<CompanyAdmin | null>;
    findAnyPendingByEmail(email: string): Promise<CompanyAdmin | null>;
    findAnyByEmail(email: string): Promise<CompanyAdmin | null>;
    update(id: number, admin: Partial<CompanyAdmin>, options?: { transaction?: any }): Promise<CompanyAdmin | null>;
}

import { CompanyEmployee } from '../models/CompanyEmployee';

export interface ICompanyEmployeeRepository {
    create(employee: CompanyEmployee): Promise<CompanyEmployee>;
    batchCreate(employees: CompanyEmployee[]): Promise<CompanyEmployee[]>;
    remove(companyId: number, employeeId: number): Promise<boolean>;
    findByCompanyId(companyId: number): Promise<CompanyEmployee[]>;
    findByEmail(email: string): Promise<CompanyEmployee | null>;
    findById(id: number): Promise<CompanyEmployee | null>;
    update(id: number, employee: Partial<CompanyEmployee>, options?: { transaction?: any }): Promise<CompanyEmployee | null>;
}

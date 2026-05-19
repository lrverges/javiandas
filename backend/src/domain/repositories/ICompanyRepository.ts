import { Company } from '../models/Company';

export interface ICompanyRepository {
    create(company: Company): Promise<Company>;
    findById(id: number): Promise<Company | null>;
    findAll(options?: { page?: number; limit?: number; search?: string; benefitType?: string }): Promise<{ companies: Company[]; total: number }>;
    update(id: number, company: Partial<Company>): Promise<Company | null>;
    findByCuit(cuit: string): Promise<Company | null>;
}

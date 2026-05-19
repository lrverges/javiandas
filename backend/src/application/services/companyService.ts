import { Company } from '../../domain/models/Company';
import { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import { AppError } from '../../presentation/middlewares/errorHandler';

export class CompanyService {
    constructor(private companyRepository: ICompanyRepository) {}

    async createCompany(data: {
        name: string;
        cuit: string;
        street: string;
        addressNumber: string;
        locality: string;
        benefitType: string;
        allowExtraAddresses: boolean;
    }): Promise<Company> {
        // Validar formato de CUIT
        const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
        if (!cuitRegex.test(data.cuit)) {
            throw new AppError('El formato de CUIT debe ser XX-XXXXXXXX-X', 400);
        }

        // Verificar CUIT existente
        const existing = await this.companyRepository.findByCuit(data.cuit);
        if (existing) {
            throw new AppError(`Ya existe una empresa con el CUIT ${data.cuit}`, 409);
        }

        const company = new Company({
            name: data.name,
            cuit: data.cuit,
            street: data.street,
            addressNumber: data.addressNumber,
            locality: data.locality,
            benefitType: data.benefitType,
            allowExtraAddresses: data.allowExtraAddresses,
        });

        return await this.companyRepository.create(company);
    }

    async listCompanies(options?: { page?: number; limit?: number; search?: string; benefitType?: string }): Promise<{ companies: Company[]; total: number }> {
        return await this.companyRepository.findAll(options);
    }

    async getCompanyDetail(id: number): Promise<Company> {
        const company = await this.companyRepository.findById(id);
        if (!company) {
            throw new AppError('Empresa no encontrada', 404);
        }
        return company;
    }

    async updateCompany(id: number, data: Partial<Company>): Promise<Company> {
        // CUIT es inmutable, se remueve silenciosamente
        const { cuit, ...updateData } = data;

        const updated = await this.companyRepository.update(id, updateData);
        if (!updated) {
            throw new AppError('Empresa no encontrada', 404);
        }
        return updated;
    }
}

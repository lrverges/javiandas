import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CompanyService } from '../../application/services/companyService';
import { CompanyAdminService } from '../../application/services/companyAdminService';
import { CompanyEmployeeService } from '../../application/services/companyEmployeeService';

const createCompanySchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    cuit: z.string().regex(/^\d{2}-\d{8}-\d{1}$/, 'CUIT inválido. Debe ser XX-XXXXXXXX-X'),
    street: z.string().min(1, 'La calle es requerida'),
    addressNumber: z.string().min(1, 'El número es requerido'),
    locality: z.string().min(1, 'La localidad es requerida'),
    benefitType: z.enum(['Corporativo', 'Corporativo Premium'], { message: 'Tipo de beneficio inválido' }),
    allowExtraAddresses: z.boolean()
});

const updateCompanySchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    cuit: z.string().optional(),
    street: z.string().min(1, 'La calle es requerida').optional(),
    addressNumber: z.string().min(1, 'El número es requerido').optional(),
    locality: z.string().min(1, 'La localidad es requerida').optional(),
    benefitType: z.enum(['Corporativo', 'Corporativo Premium'], { message: 'Tipo de beneficio inválido' }).optional(),
    allowExtraAddresses: z.boolean().optional(),
    isActive: z.boolean().optional()
});

const assignAdminSchema = z.object({
    email: z.string().email('Formato de email inválido')
});

const batchEmployeesSchema = z.object({
    emails: z.array(z.string()).min(1, 'Debe proveer al menos un email')
});

export class CompanyController {
    constructor(
        private companyService: CompanyService,
        private companyAdminService: CompanyAdminService,
        private companyEmployeeService: CompanyEmployeeService
    ) {}

    async createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = createCompanySchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    message: parsed.error.issues[0].message,
                    data: null
                });
                return;
            }

            const result = await this.companyService.createCompany(parsed.data);
            res.status(201).json({
                success: true,
                message: 'Empresa creada exitosamente',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async listCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = (req.query.search as string) || '';
            const benefitType = (req.query.benefitType as string) || '';

            const result = await this.companyService.listCompanies({ page, limit, search, benefitType });
            res.json({
                success: true,
                message: 'Empresas obtenidas exitosamente',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getCompanyDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id as string);
            if (isNaN(id)) {
                res.status(400).json({ success: false, message: 'ID de empresa inválido', data: null });
                return;
            }

            const result = await this.companyService.getCompanyDetail(id);
            res.json({
                success: true,
                message: 'Detalle de empresa obtenido exitosamente',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async updateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id as string);
            if (isNaN(id)) {
                res.status(400).json({ success: false, message: 'ID de empresa inválido', data: null });
                return;
            }

            const parsed = updateCompanySchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    message: parsed.error.issues[0].message,
                    data: null
                });
                return;
            }

            const result = await this.companyService.updateCompany(id, parsed.data);
            res.json({
                success: true,
                message: 'Empresa actualizada exitosamente',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async assignAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const companyId = parseInt(req.params.id as string);
            if (isNaN(companyId)) {
                res.status(400).json({ success: false, message: 'ID de empresa inválido', data: null });
                return;
            }

            const parsed = assignAdminSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    message: parsed.error.issues[0].message,
                    data: null
                });
                return;
            }

            const result = await this.companyAdminService.assignAdmin(companyId, parsed.data.email);
            res.status(201).json({
                success: true,
                message: 'Administrador asignado exitosamente',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async removeAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const companyId = parseInt(req.params.id as string);
            const adminId = parseInt(req.params.adminId as string);
            if (isNaN(companyId) || isNaN(adminId)) {
                res.status(400).json({ success: false, message: 'IDs de parámetros inválidos', data: null });
                return;
            }

            await this.companyAdminService.removeAdmin(companyId, adminId);
            res.json({
                success: true,
                message: 'Administrador removido exitosamente',
                data: null
            });
        } catch (error) {
            next(error);
        }
    }

    async batchEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const companyId = parseInt(req.params.id as string);
            if (isNaN(companyId)) {
                res.status(400).json({ success: false, message: 'ID de empresa inválido', data: null });
                return;
            }

            const parsed = batchEmployeesSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    message: parsed.error.issues[0].message,
                    data: null
                });
                return;
            }

            const result = await this.companyEmployeeService.batchCreateEmployees(companyId, parsed.data.emails);
            res.status(200).json({
                success: true,
                message: 'Procesamiento de carga masiva finalizado',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async removeEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const companyId = parseInt(req.params.id as string);
            const employeeId = parseInt(req.params.employeeId as string);
            if (isNaN(companyId) || isNaN(employeeId)) {
                res.status(400).json({ success: false, message: 'IDs de parámetros inválidos', data: null });
                return;
            }

            await this.companyEmployeeService.removeEmployee(companyId, employeeId);
            res.json({
                success: true,
                message: 'Pre-asignación de empleado eliminada exitosamente',
                data: null
            });
        } catch (error) {
            next(error);
        }
    }
}

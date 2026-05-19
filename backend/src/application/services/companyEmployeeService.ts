import { CompanyEmployee } from '../../domain/models/CompanyEmployee';
import { ICompanyEmployeeRepository } from '../../domain/repositories/ICompanyEmployeeRepository';
import { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import { AppError } from '../../presentation/middlewares/errorHandler';
import { z } from 'zod';
import { UniqueConstraintError } from 'sequelize';

export class CompanyEmployeeService {
    constructor(
        private companyEmployeeRepository: ICompanyEmployeeRepository,
        private companyRepository: ICompanyRepository
    ) {}

    async batchCreateEmployees(
        companyId: number,
        emails: string[]
    ): Promise<{
        added: string[];
        errors: { email: string; reason: string }[];
        summary: { total: number; successful: number; failed: number };
    }> {
        // Verificar que la empresa exista
        const company = await this.companyRepository.findById(companyId);
        if (!company) {
            throw new AppError('Empresa no encontrada', 404);
        }

        const added: string[] = [];
        const errors: { email: string; reason: string }[] = [];
        const processedEmails = new Set<string>();

        const emailSchema = z.string().email('Formato de email inválido');

        for (const email of emails) {
            const cleanEmail = email.trim().toLowerCase();

            // 1. Detectar duplicados en la misma solicitud
            if (processedEmails.has(cleanEmail)) {
                errors.push({ email, reason: 'Email duplicado en esta solicitud' });
                continue;
            }
            processedEmails.add(cleanEmail);

            // 2. Validar formato de email con Zod
            const validation = emailSchema.safeParse(cleanEmail);
            if (!validation.success) {
                errors.push({ email, reason: 'Formato de email inválido' });
                continue;
            }

            // 3. Verificar unicidad global en company_employees
            const existingEmployee = await this.companyEmployeeRepository.findByEmail(cleanEmail);
            if (existingEmployee) {
                if (existingEmployee.companyId !== companyId) {
                    errors.push({ email, reason: 'Email ya está asignado a otra empresa' });
                }
                // Si es de la misma empresa, se ignora de forma idempotente sin error (no se vuelve a insertar)
                continue;
            }

            // 4. Intentar inserción individual y segura para mitigar TOCTOU y asegurar reporte parcial completo
            try {
                const empToCreate = new CompanyEmployee({
                    companyId,
                    email: cleanEmail,
                    userId: null,
                    status: 'pending'
                });
                await this.companyEmployeeRepository.create(empToCreate);
                added.push(cleanEmail);
            } catch (error: any) {
                if (error instanceof UniqueConstraintError) {
                    const doubleCheck = await this.companyEmployeeRepository.findByEmail(cleanEmail);
                    if (doubleCheck && doubleCheck.companyId !== companyId) {
                        errors.push({ email, reason: 'Email ya está asignado a otra empresa' });
                    }
                    // Si es de la misma empresa, se ignora de forma idempotente (no se cuenta como error)
                } else {
                    errors.push({ email, reason: error.message || 'Error al guardar empleado' });
                }
            }
        }

        return {
            added,
            errors,
            summary: {
                total: emails.length,
                successful: added.length,
                failed: errors.length
            }
        };
    }

    async removeEmployee(companyId: number, employeeId: number): Promise<boolean> {
        const employee = await this.companyEmployeeRepository.findById(employeeId);
        if (!employee) {
            throw new AppError('Empleado no encontrado', 404);
        }

        // Bloquear eliminación si el empleado ya está registrado
        if (employee.status === 'registered') {
            throw new AppError('No se puede eliminar un empleado que ya se registró en la plataforma', 409);
        }

        return await this.companyEmployeeRepository.remove(companyId, employeeId);
    }
}

import { CompanyEmployee } from '../../domain/models/CompanyEmployee';
import { ICompanyEmployeeRepository } from '../../domain/repositories/ICompanyEmployeeRepository';
import { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import { ICompanyAdminRepository } from '../../domain/repositories/ICompanyAdminRepository';
import { AppError } from '../../presentation/middlewares/errorHandler';
import { z } from 'zod';
import { UniqueConstraintError } from 'sequelize';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IAddressRepository } from '../../domain/repositories/IAddressRepository';
import { Address } from '../../domain/models/Address';
import { sequelize } from '../../infrastructure/database/sequelize';

export class CompanyEmployeeService {
    constructor(
        private companyEmployeeRepository: ICompanyEmployeeRepository,
        private companyRepository: ICompanyRepository,
        private companyAdminRepository?: ICompanyAdminRepository,
        private userRepository?: IUserRepository,
        private addressRepository?: IAddressRepository
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

            // Verificar si está asignado a otra empresa como administrador
            if (this.companyAdminRepository) {
                const existingAdmin = await this.companyAdminRepository.findAnyByEmail(cleanEmail);
                if (existingAdmin && existingAdmin.companyId !== companyId) {
                    errors.push({ email, reason: 'Email ya está asignado a otra empresa' });
                    continue;
                }
            }

            // 4. Intentar inserción o vinculación inmediata
            try {
                let linkedUserId: number | null = null;
                let finalStatus: 'pending' | 'registered' = 'pending';

                // Si se proporcionó userRepository, verificamos si el usuario ya existe para vinculación inmediata
                if (this.userRepository) {
                    const existingUser = await this.userRepository.findByEmail(cleanEmail);
                    if (existingUser) {
                        linkedUserId = existingUser.id!;
                        finalStatus = 'registered';

                        const tx = await sequelize.transaction();
                        try {
                            // Actualizar companyId del usuario
                            await this.userRepository.update(linkedUserId, {
                                companyId: companyId
                            }, { transaction: tx });

                            // Crear registro de empleado
                            const empToCreate = new CompanyEmployee({
                                companyId,
                                email: cleanEmail,
                                userId: linkedUserId,
                                status: finalStatus
                            });
                            await this.companyEmployeeRepository.create(empToCreate, { transaction: tx });

                            // Inyectar dirección corporativa si corresponde
                            if (this.addressRepository) {
                                const hasValidAddress = Boolean(company.street && company.addressNumber && company.locality);
                                if (hasValidAddress) {
                                    await this.addressRepository.clearDefaultByUserId(linkedUserId, { transaction: tx });
                                    const defaultAddress = new Address({
                                        userId: linkedUserId,
                                        street: company.street,
                                        number: company.addressNumber,
                                        locality: company.locality,
                                        reference: 'Dirección Corporativa',
                                        isDefault: true
                                    });
                                    await this.addressRepository.create(defaultAddress, { transaction: tx });
                                }
                            }

                            await tx.commit();
                            added.push(cleanEmail);
                            continue; // Pasar al siguiente email
                        } catch (txError) {
                            await tx.rollback();
                            throw txError;
                        }
                    }
                }

                // Inserción normal si no existe el usuario
                const empToCreate = new CompanyEmployee({
                    companyId,
                    email: cleanEmail,
                    userId: linkedUserId,
                    status: finalStatus
                });
                await this.companyEmployeeRepository.create(empToCreate);
                added.push(cleanEmail);
            } catch (error: any) {
                if (error instanceof UniqueConstraintError || error.name === 'SequelizeUniqueConstraintError') {
                    const doubleCheck = await this.companyEmployeeRepository.findByEmail(cleanEmail);
                    if (doubleCheck && doubleCheck.companyId !== companyId) {
                        errors.push({ email, reason: 'Email ya está asignado a otra empresa' });
                    }
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

        // Bloquear eliminación si es administrador activo
        if (this.companyAdminRepository) {
            const admin = await this.companyAdminRepository.findByEmail(companyId, employee.email);
            if (admin && admin.status !== 'inactive') {
                throw new AppError('Debe remover el rol de administrador antes de dar de baja al empleado', 400);
            }
        }

        const tx = await sequelize.transaction();
        try {
            // Baja lógica
            const updated = await this.companyEmployeeRepository.update(employeeId, { status: 'inactive' }, { transaction: tx });
            if (!updated) {
                await tx.rollback();
                return false;
            }

            // Si el empleado estaba registrado, quitarle el companyId y la dirección corporativa
            if (employee.userId && employee.status === 'registered') {
                if (this.userRepository) {
                    await this.userRepository.update(employee.userId, { companyId: null }, { transaction: tx });
                }
                if (this.addressRepository) {
                    // Buscar direcciones del usuario
                    const addresses = await this.addressRepository.findByUserId(employee.userId);
                    const corpAddress = addresses.find(a => a.reference === 'Dirección Corporativa');
                    if (corpAddress && corpAddress.id) {
                        await this.addressRepository.delete(corpAddress.id, { transaction: tx });
                        if (corpAddress.isDefault) {
                            const remaining = addresses.filter(a => a.id !== corpAddress.id);
                            if (remaining.length > 0) {
                                remaining.sort((a, b) => (b.id || 0) - (a.id || 0));
                                await this.addressRepository.update(remaining[0].id!, { isDefault: true }, { transaction: tx });
                            }
                        }
                    }
                }
            }

            await tx.commit();
            return true;
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    }
}

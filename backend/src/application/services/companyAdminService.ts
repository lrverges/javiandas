import { CompanyAdmin } from '../../domain/models/CompanyAdmin';
import { ICompanyAdminRepository } from '../../domain/repositories/ICompanyAdminRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import { AppError } from '../../presentation/middlewares/errorHandler';
import { sequelize } from '../../infrastructure/database/sequelize';

export class CompanyAdminService {
    constructor(
        private companyAdminRepository: ICompanyAdminRepository,
        private userRepository: IUserRepository,
        private companyRepository: ICompanyRepository
    ) {}

    async assignAdmin(companyId: number, email: string): Promise<CompanyAdmin> {
        // Verificar que la empresa exista
        const company = await this.companyRepository.findById(companyId);
        if (!company) {
            throw new AppError('Empresa no encontrada', 404);
        }

        // Verificar si ya está asignado como admin de esta empresa
        const existingAssignment = await this.companyAdminRepository.findByEmail(companyId, email);
        if (existingAssignment) {
            throw new AppError('Este email ya es administrador de esta empresa', 409);
        }

        // Verificar si el usuario ya está registrado en el sistema
        const registeredUser = await this.userRepository.findByEmail(email);

        if (registeredUser) {
            const tx = await sequelize.transaction();
            try {
                // Actualizar rol y empresa del usuario registrado
                await this.userRepository.update(registeredUser.id!, {
                    role: 'admin_empresa',
                    companyId: companyId
                }, { transaction: tx });

                // Asignación activa
                const newAdmin = new CompanyAdmin({
                    companyId,
                    userId: registeredUser.id,
                    email,
                    status: 'active'
                });

                const assignedAdmin = await this.companyAdminRepository.assign(newAdmin, { transaction: tx });
                await tx.commit();
                return assignedAdmin;
            } catch (error) {
                await tx.rollback();
                throw error;
            }
        } else {
            // Pre-asignación pendiente (el usuario no existe aún)
            const newAdmin = new CompanyAdmin({
                companyId,
                userId: null,
                email,
                status: 'pending'
            });

            return await this.companyAdminRepository.assign(newAdmin);
        }
    }

    async removeAdmin(companyId: number, adminId: number): Promise<boolean> {
        // Buscar el administrador para saber si tiene userId asociado
        const admins = await this.companyAdminRepository.findByCompanyId(companyId);
        const adminToRemove = admins.find(a => a.id === adminId);
        if (!adminToRemove) {
            throw new AppError('Administrador no encontrado', 404);
        }

        const tx = await sequelize.transaction();
        try {
            // Remover asociación
            const removed = await this.companyAdminRepository.remove(companyId, adminId, { transaction: tx });
            if (!removed) {
                await tx.rollback();
                return false;
            }

            // Si tenía una cuenta de usuario, revertimos su rol a 'user' y desvinculamos su empresa
            if (adminToRemove.userId) {
                await this.userRepository.update(adminToRemove.userId, {
                    role: 'user',
                    companyId: null
                }, { transaction: tx });
            }

            await tx.commit();
            return true;
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    }
}

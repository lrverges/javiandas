import { User } from '../../domain/models/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserModel } from '../database/models/UserModel';

export class SequelizeUserRepository implements IUserRepository {
    async findByEmail(email: string): Promise<User | null> {
        const user = await UserModel.findOne({ where: { email } });
        if (!user) return null;
        return new User({
            id: user.id,
            email: user.email,
            name: user.name,
            password: user.password || undefined,
            role: user.role,
            companyId: user.companyId,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            dni: user.dni,
            isVerified: user.isVerified,
        });
    }

    async create(user: User, options?: { transaction?: any }): Promise<User> {
        const createdUser = await UserModel.create({
            email: user.email,
            name: user.name,
            password: user.password,
            role: user.role || 'user',
            companyId: user.companyId || null,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            dni: user.dni,
            isVerified: user.isVerified !== undefined ? user.isVerified : false,
        }, options);
        return new User({
            id: createdUser.id,
            email: createdUser.email,
            name: createdUser.name,
            password: createdUser.password,
            role: createdUser.role,
            companyId: createdUser.companyId,
            firstName: createdUser.firstName,
            lastName: createdUser.lastName,
            phone: createdUser.phone,
            dni: createdUser.dni,
            isVerified: createdUser.isVerified
        });
    }

    async update(id: number, user: Partial<User>, options?: { transaction?: any }): Promise<User | null> {
        const found = await UserModel.findByPk(id, options);
        if (!found) return null;
        await found.update(user, options);
        return new User({
            id: found.id,
            email: found.email,
            name: found.name,
            password: found.password,
            role: found.role,
            companyId: found.companyId,
            firstName: found.firstName,
            lastName: found.lastName,
            phone: found.phone,
            dni: found.dni,
            isVerified: found.isVerified
        });
    }

    async findById(id: number, options?: { transaction?: any }): Promise<User | null> {
        const found = await UserModel.findByPk(id, options);
        if (!found) return null;
        return new User({
            id: found.id,
            email: found.email,
            name: found.name,
            password: found.password || undefined,
            role: found.role,
            companyId: found.companyId,
            firstName: found.firstName,
            lastName: found.lastName,
            phone: found.phone,
            dni: found.dni,
            isVerified: found.isVerified,
        });
    }
}

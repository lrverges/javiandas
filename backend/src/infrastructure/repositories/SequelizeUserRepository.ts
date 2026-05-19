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
        });
    }

    async create(user: User, options?: { transaction?: any }): Promise<User> {
        const createdUser = await UserModel.create({
            email: user.email,
            name: user.name,
            password: user.password,
            role: user.role || 'user',
            companyId: user.companyId || null,
        }, options);
        return new User({
            id: createdUser.id,
            email: createdUser.email,
            name: createdUser.name,
            password: createdUser.password || undefined,
            role: createdUser.role,
            companyId: createdUser.companyId,
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
            password: found.password || undefined,
            role: found.role,
            companyId: found.companyId,
        });
    }
}

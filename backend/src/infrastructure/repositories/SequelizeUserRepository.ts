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
        });
    }

    async create(user: User): Promise<User> {
        const createdUser = await UserModel.create({
            email: user.email,
            name: user.name,
            password: user.password,
            role: user.role || 'user',
        });
        return new User({
            id: createdUser.id,
            email: createdUser.email,
            name: createdUser.name,
            password: createdUser.password || undefined,
            role: createdUser.role,
        });
    }
}

import { User } from '../models/User';

export interface IUserRepository {
    findByEmail(email: string): Promise<User | null>;
    create(user: User, options?: { transaction?: any }): Promise<User>;
    update(id: number, user: Partial<User>, options?: { transaction?: any }): Promise<User | null>;
    findById(id: number, options?: { transaction?: any }): Promise<User | null>;
}

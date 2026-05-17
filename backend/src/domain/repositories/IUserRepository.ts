import { User } from '../models/User';

export interface IUserRepository {
    findByEmail(email: string): Promise<User | null>;
    create(user: User): Promise<User>;
}

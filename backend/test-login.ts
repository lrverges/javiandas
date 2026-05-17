import { UserModel } from './src/infrastructure/database/models/UserModel';
import { sequelize } from './src/infrastructure/database/sequelize';
import { SequelizeUserRepository } from './src/infrastructure/repositories/SequelizeUserRepository';
import { AuthService } from './src/application/services/authService';

async function testLogin() {
    await sequelize.authenticate();
    const user = await UserModel.findOne({ where: { email: 'guest@guest.com' } });
    console.log('User in DB:', user?.toJSON());

    const repo = new SequelizeUserRepository();
    const authService = new AuthService(repo);
    
    const result = await authService.login('guest@guest.com', 'guest');
    console.log('Login result:', result ? 'Success' : 'Failed');
    
    process.exit(0);
}

testLogin().catch(console.error);

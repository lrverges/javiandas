import { sequelize } from './infrastructure/database/sequelize';
import { setupAssociations } from './infrastructure/database/associations';
import { Logger } from './infrastructure/logging/logger';
import bcrypt from 'bcrypt';
import { UserModel } from './infrastructure/database/models/UserModel';

async function clearAndSeed() {
    try {
        setupAssociations();
        // Force drop and recreate all tables
        await sequelize.sync({ force: true });
        Logger.info('🎉 Base de datos limpiada y recreada con éxito.');

        // Seed default guest user
        const hashedPassword = await bcrypt.hash('Pa$$w0rd123', 10);
        await UserModel.create({
            email: 'guest@guest.com',
            name: 'Guest User',
            password: hashedPassword,
            role: 'admin_javiandas',
        });
        
        // Also create a normal user for admin assignment testing if needed
        const hashedUserPassword = await bcrypt.hash('Pa$$w0rd123', 10);
        await UserModel.create({
            email: 'active-admin@acme.com',
            name: 'Acme Active Admin',
            password: hashedUserPassword,
            role: 'user',
        });

        Logger.info('🎉 Usuarios de prueba recreados con éxito.');
        process.exit(0);
    } catch (error) {
        Logger.error('❌ Error al limpiar base de datos:', error);
        process.exit(1);
    }
}

clearAndSeed();

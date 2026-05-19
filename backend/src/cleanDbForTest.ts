import { sequelize } from './infrastructure/database/sequelize';
import { setupAssociations } from './infrastructure/database/associations';
import { UserModel } from './infrastructure/database/models/UserModel';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

async function clean() {
    try {
        setupAssociations();
        await sequelize.authenticate();

        // 1. Desactivar FK checks y truncar tablas de US-02 con nombres correctos en la base de datos
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await sequelize.query('UPDATE users SET companyId = NULL');
        await sequelize.query('TRUNCATE TABLE company_employees');
        await sequelize.query('TRUNCATE TABLE company_admins');
        await sequelize.query('TRUNCATE TABLE companies');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('🧹 Tablas B2B truncadas con éxito y FKs en users reseteados.');

        const hashedPassword = await bcrypt.hash('Pa$$w0rd123', 10);

        // 2. Asegurar que guest@guest.com existe y tiene rol admin_javiandas
        const [user, created] = await UserModel.findOrCreate({
            where: { email: 'guest@guest.com' },
            defaults: {
                email: 'guest@guest.com',
                name: 'Guest Admin',
                password: hashedPassword,
                role: 'admin_javiandas',
            }
        });

        if (!created) {
            user.password = hashedPassword;
            user.role = 'admin_javiandas';
            await user.save();
        }
        console.log('🎉 Usuario guest@guest.com asegurado con rol admin_javiandas.');

        // 3. Asegurar que active-admin@acme.com existe y tiene rol user para pruebas de asignación
        const [testUser, testCreated] = await UserModel.findOrCreate({
            where: { email: 'active-admin@acme.com' },
            defaults: {
                email: 'active-admin@acme.com',
                name: 'Active Admin Test',
                password: hashedPassword,
                role: 'user',
            }
        });

        if (!testCreated) {
            testUser.password = hashedPassword;
            testUser.role = 'user';
            await testUser.save();
        }
        console.log('🎉 Usuario active-admin@acme.com asegurado con rol user.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error limpiando la base de datos:', error);
        process.exit(1);
    }
}

clean();

import { UserModel } from './infrastructure/database/models/UserModel';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { Logger } from './infrastructure/logging/logger';

dotenv.config();

async function seed() {
    const hashedPassword = await bcrypt.hash('Pa$$w0rd123', 10);
    
    // Verificar si ya existe
    const existing = await UserModel.findOne({ where: { email: 'guest@guest.com' } });
    if (existing) {
        existing.password = hashedPassword;
        await existing.save();
        Logger.info('🎉 Usuario de prueba guest@guest.com actualizado con éxito.');
        return;
    }

    await UserModel.create({
        email: 'guest@guest.com',
        name: 'Guest User',
        password: hashedPassword,
    });
    Logger.info('🎉 Usuario de prueba guest@guest.com creado con éxito.');
}

seed().catch((err) => Logger.error('Error seeding database', err));

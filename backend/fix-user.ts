import { UserModel } from './src/infrastructure/database/models/UserModel';
import bcrypt from 'bcrypt';
import { sequelize } from './src/infrastructure/database/sequelize';

async function fixUser() {
    await sequelize.authenticate();
    const user = await UserModel.findOne({ where: { email: 'guest@guest.com' } });
    if (user) {
        const hashedPassword = await bcrypt.hash('guest', 10);
        user.password = hashedPassword;
        await user.save();
        console.log('Password updated successfully');
    } else {
        console.log('User not found');
    }
    process.exit(0);
}

fixUser().catch(console.error);

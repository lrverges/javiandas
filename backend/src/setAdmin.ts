import { UserModel } from './infrastructure/database/models/UserModel';
import dotenv from 'dotenv';
import { setupAssociations } from './infrastructure/database/associations';

dotenv.config();

async function run() {
    setupAssociations();
    const user = await UserModel.findOne({ where: { email: 'guest@guest.com' } });
    if (user) {
        user.role = 'admin_javiandas';
        await user.save();
        console.log('🎉 User guest@guest.com role set to admin_javiandas');
    } else {
        console.log('❌ User guest@guest.com not found');
    }
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});

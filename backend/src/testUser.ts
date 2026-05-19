import { UserModel } from './infrastructure/database/models/UserModel';
import dotenv from 'dotenv';
import { setupAssociations } from './infrastructure/database/associations';

dotenv.config();

async function run() {
    setupAssociations();
    const user = await UserModel.findOne({ where: { email: 'guest@guest.com' } });
    if (user) {
        console.log('🎉 Guest user:', JSON.stringify(user.toJSON(), null, 2));
    } else {
        console.log('❌ Guest user not found!');
    }
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});

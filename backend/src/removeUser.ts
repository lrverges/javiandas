import { UserModel } from './infrastructure/database/models/UserModel';
import { AddressModel } from './infrastructure/database/models/AddressModel';
import { CompanyAdminModel } from './infrastructure/database/models/CompanyAdminModel';
import dotenv from 'dotenv';
import { setupAssociations } from './infrastructure/database/associations';

dotenv.config();

async function run() {
    setupAssociations();
    const email = 'lrverges@gmail.com';
    const user = await UserModel.findOne({ where: { email } });
    if (user) {
        // Delete addresses
        await AddressModel.destroy({ where: { userId: user.id } });
        // Delete user
        await user.destroy();
        console.log(`🎉 User ${email} deleted successfully.`);
    } else {
        console.log(`ℹ️ User ${email} not found in users table.`);
    }

    // Reset company admin
    const admin = await CompanyAdminModel.findOne({ where: { email } });
    if (admin) {
        admin.userId = null;
        admin.status = 'pending';
        await admin.save();
        console.log(`🎉 Company admin for ${email} reset to pending.`);
    } else {
        console.log(`ℹ️ Company admin assignment for ${email} not found.`);
    }

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});

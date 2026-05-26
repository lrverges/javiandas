import { UserModel } from './infrastructure/database/models/UserModel';
import { CompanyAdminModel } from './infrastructure/database/models/CompanyAdminModel';
import { CompanyEmployeeModel } from './infrastructure/database/models/CompanyEmployeeModel';
import dotenv from 'dotenv';
import { setupAssociations } from './infrastructure/database/associations';

dotenv.config();

async function run() {
    setupAssociations();
    const email = 'lrverges@gmail.com';
    const user = await UserModel.findOne({ where: { email } });
    if (user) {
        console.log('👤 User found:', {
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
            isVerified: user.isVerified
        });
    } else {
        console.log('❌ User not found with email:', email);
    }

    const admin = await CompanyAdminModel.findOne({ where: { email } });
    if (admin) {
        console.log('🏢 Admin assignment found:', {
            id: admin.id,
            companyId: admin.companyId,
            userId: admin.userId,
            status: admin.status
        });
    } else {
        console.log('❌ Company admin assignment not found with email:', email);
    }

    const employee = await CompanyEmployeeModel.findOne({ where: { email } });
    if (employee) {
        console.log('👥 Employee assignment found:', {
            id: employee.id,
            companyId: employee.companyId,
            userId: employee.userId,
            status: employee.status
        });
    } else {
        console.log('❌ Company employee assignment not found with email:', email);
    }

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});

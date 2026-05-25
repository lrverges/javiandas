import { CompanyModel } from './models/CompanyModel';
import { CompanyAdminModel } from './models/CompanyAdminModel';
import { CompanyEmployeeModel } from './models/CompanyEmployeeModel';
import { UserModel } from './models/UserModel';
import { AddressModel } from './models/AddressModel';
import { EmailVerificationModel } from './models/EmailVerificationModel';

export function setupAssociations() {
    // Company - CompanyAdmin
    CompanyModel.hasMany(CompanyAdminModel, { foreignKey: 'companyId', as: 'admins', onDelete: 'CASCADE' });
    CompanyAdminModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });

    // Company - CompanyEmployee
    CompanyModel.hasMany(CompanyEmployeeModel, { foreignKey: 'companyId', as: 'employees', onDelete: 'CASCADE' });
    CompanyEmployeeModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });

    // Company - User
    CompanyModel.hasMany(UserModel, { foreignKey: 'companyId', as: 'users' });
    UserModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });

    // CompanyAdmin - User
    CompanyAdminModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user', onDelete: 'SET NULL' });
    UserModel.hasMany(CompanyAdminModel, { foreignKey: 'userId', as: 'adminAssignments' });

    // CompanyEmployee - User
    CompanyEmployeeModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user', onDelete: 'SET NULL' });
    UserModel.hasOne(CompanyEmployeeModel, { foreignKey: 'userId', as: 'employeeAssignment' });

    // User - Address
    UserModel.hasMany(AddressModel, { foreignKey: 'userId', as: 'addresses', onDelete: 'CASCADE' });
    AddressModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });
}

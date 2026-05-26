import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize';

export class CompanyAdminModel extends Model {
    declare id: number;
    declare companyId: number;
    declare userId: number | null;
    declare email: string;
    declare status: 'active' | 'pending' | 'inactive';
}

CompanyAdminModel.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
    }
}, {
    sequelize,
    tableName: 'company_admins',
    timestamps: true,
    indexes: [
        {
            fields: ['companyId', 'email']
        }
    ]
});

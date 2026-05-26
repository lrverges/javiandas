import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize';

export class CompanyEmployeeModel extends Model {
    declare id: number;
    declare companyId: number;
    declare email: string;
    declare userId: number | null;
    declare status: 'pending' | 'registered' | 'inactive';
}

CompanyEmployeeModel.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
    }
}, {
    sequelize,
    tableName: 'company_employees',
    timestamps: true,
});

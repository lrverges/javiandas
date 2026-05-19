import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize';

export class CompanyModel extends Model {
    declare id: number;
    declare name: string;
    declare cuit: string;
    declare street: string;
    declare addressNumber: string;
    declare locality: string;
    declare benefitType: string;
    declare allowExtraAddresses: boolean;
    declare isActive: boolean;
}

CompanyModel.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    cuit: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            is: /^\d{2}-\d{8}-\d{1}$/
        }
    },
    street: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    addressNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    locality: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    benefitType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    allowExtraAddresses: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    }
}, {
    sequelize,
    tableName: 'companies',
    timestamps: true,
});

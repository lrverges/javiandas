import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize';

export class AddressModel extends Model {
    declare id: number;
    declare userId: number;
    declare street: string;
    declare number: string;
    declare locality: string;
    declare reference: string | null;
    declare isDefault: boolean;
}

AddressModel.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    street: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    number: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    locality: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    reference: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize,
    tableName: 'addresses',
    timestamps: true,
});

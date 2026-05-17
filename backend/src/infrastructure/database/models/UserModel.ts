import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize';

export class UserModel extends Model {
    declare id: number;
    declare email: string;
    declare name: string;
    declare password: string | null;
    declare role: string;
}

UserModel.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user',
    },
}, {
    sequelize,
    tableName: 'users',
    timestamps: true,
});

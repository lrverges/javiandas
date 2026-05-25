import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize';

export class EmailVerificationModel extends Model {
    declare email: string;
    declare otpCode: string;
    declare expiresAt: Date;
    declare verified: boolean;
}

EmailVerificationModel.init({
    email: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    otpCode: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    sequelize,
    tableName: 'email_verifications',
    timestamps: true,
});

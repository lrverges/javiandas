import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is required');
}

export const sequelize = new Sequelize(dbUrl, {
    dialect: 'mysql',
    logging: false,
});

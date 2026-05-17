import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function createDb() {
    // Conectar sin especificar base de datos
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '4128Codigo4128', // Usamos la contraseña que vimos en el .env
    });

    await connection.query('CREATE DATABASE IF NOT EXISTS viandas_saludables;');
    console.log('🎉 Base de datos "viandas_saludables" creada con éxito.');
    await connection.end();
}

createDb().catch(console.error);

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './presentation/routes/authRoutes';
import adminRoutes from './presentation/routes/adminRoutes';
import { sequelize } from './infrastructure/database/sequelize';
import { errorHandler } from './presentation/middlewares/errorHandler';
import { Logger } from './infrastructure/logging/logger';

import { setupAssociations } from './infrastructure/database/associations';

// Cargar variables de entorno
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(helmet());
app.use(cors({ 
    origin: process.env.CORS_ORIGIN || function (origin, callback) {
        if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('API de Viandas Saludables funcionando 🥗');
});

// Middleware de errores
app.use(errorHandler);

// Iniciar servidor
async function startServer() {
    try {
        setupAssociations();
        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: true });
            Logger.info('📦 Base de datos sincronizada');
        } else {
            await sequelize.authenticate();
            Logger.info('📦 Base de datos conectada');
        }
        
        app.listen(port, () => {
            Logger.info(`🚀 Servidor corriendo en http://localhost:${port}`);
        });
    } catch (error) {
        Logger.error('❌ Error al conectar con la base de datos', error);
    }
}

startServer();


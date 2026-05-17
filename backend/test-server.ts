import express from 'express';
import cors from 'cors';
import { sequelize } from './src/infrastructure/database/sequelize';
import authRoutes from './src/presentation/routes/authRoutes';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

sequelize.sync().then(() => {
    const srv = app.listen(4001, async () => {
        console.log('Server started on 4001');
        const res = await fetch('http://localhost:4001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'guest@guest.com', password: 'guest' })
        });
        console.log('Status:', res.status);
        console.log('Response:', await res.json());
        srv.close();
        process.exit(0);
    });
});

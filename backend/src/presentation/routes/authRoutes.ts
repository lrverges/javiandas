import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../../application/services/authService';
import { SequelizeUserRepository } from '../../infrastructure/repositories/SequelizeUserRepository';
import { SequelizeCompanyEmployeeRepository } from '../../infrastructure/repositories/SequelizeCompanyEmployeeRepository';
import { SequelizeCompanyRepository } from '../../infrastructure/repositories/SequelizeCompanyRepository';
import { SequelizeAddressRepository } from '../../infrastructure/repositories/SequelizeAddressRepository';
import { SequelizeEmailVerificationRepository } from '../../infrastructure/repositories/SequelizeEmailVerificationRepository';
import { SequelizeCompanyAdminRepository } from '../../infrastructure/repositories/SequelizeCompanyAdminRepository';
import { GoogleAuthProvider } from '../../infrastructure/providers/GoogleAuthProvider';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// Rate limiting middleware for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 20 : 10000, // Limit requests per window
    message: { success: false, message: 'Too many requests, please try again later.', data: null }
});

// Instanciar dependencias (DI manual)
const userRepository = new SequelizeUserRepository();
const googleAuthProvider = new GoogleAuthProvider();
const companyEmployeeRepository = new SequelizeCompanyEmployeeRepository();
const companyRepository = new SequelizeCompanyRepository();
const addressRepository = new SequelizeAddressRepository();
const emailVerificationRepository = new SequelizeEmailVerificationRepository();
const companyAdminRepository = new SequelizeCompanyAdminRepository();

const authService = new AuthService(
    userRepository,
    googleAuthProvider,
    companyEmployeeRepository,
    companyRepository,
    addressRepository,
    undefined, // emailService (usa default)
    emailVerificationRepository,
    companyAdminRepository
);
const authController = new AuthController(authService);

// Definir rutas con rate limiting
router.post('/login', authLimiter, (req, res, next) => authController.login(req, res, next));
router.post('/google', authLimiter, (req, res, next) => authController.googleLogin(req, res, next));
router.post('/send-otp', authLimiter, (req, res, next) => authController.sendOtp(req, res, next));
router.post('/register', authLimiter, (req, res, next) => authController.register(req, res, next));
router.post('/verify-otp', authLimiter, (req, res, next) => authController.verifyOtp(req, res, next));
router.post('/resend-otp', authLimiter, (req, res, next) => authController.resendOtp(req, res, next));
router.get('/me', requireAuth, (req, res, next) => authController.getMe(req, res, next));
router.post('/logout', authLimiter, (req, res, next) => authController.logout(req, res, next));

export default router;

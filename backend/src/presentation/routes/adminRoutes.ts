import { Router } from 'express';
import { CompanyController } from '../controllers/companyController';
import { CompanyService } from '../../application/services/companyService';
import { CompanyAdminService } from '../../application/services/companyAdminService';
import { CompanyEmployeeService } from '../../application/services/companyEmployeeService';
import { SequelizeCompanyRepository } from '../../infrastructure/repositories/SequelizeCompanyRepository';
import { SequelizeCompanyAdminRepository } from '../../infrastructure/repositories/SequelizeCompanyAdminRepository';
import { SequelizeCompanyEmployeeRepository } from '../../infrastructure/repositories/SequelizeCompanyEmployeeRepository';
import { SequelizeUserRepository } from '../../infrastructure/repositories/SequelizeUserRepository';
import { requireAuth } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/requireRole';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate Limiter específico para administración B2B (más tolerante en modo testing)
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: process.env.NODE_ENV === 'test' ? 10000 : 100, // Límite amplio para la suite de integración
    message: {
        success: false,
        message: 'Demasiadas peticiones desde esta IP. Por favor intente más tarde.',
        data: null
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// DI Manual de Capas (Bottom-Up)
const companyRepo = new SequelizeCompanyRepository();
const companyAdminRepo = new SequelizeCompanyAdminRepository();
const companyEmployeeRepo = new SequelizeCompanyEmployeeRepository();
const userRepo = new SequelizeUserRepository();

const companyService = new CompanyService(companyRepo);
const companyAdminService = new CompanyAdminService(companyAdminRepo, userRepo, companyRepo);
const companyEmployeeService = new CompanyEmployeeService(companyEmployeeRepo, companyRepo);

const controller = new CompanyController(companyService, companyAdminService, companyEmployeeService);

// Middleware de Autenticación y Autorización Global de Admin Javiandas
router.use(requireAuth);
router.use(requireRole('admin_javiandas'));
router.use(adminLimiter);

// --- Endpoints de Empresas ---
router.post('/companies', (req, res, next) => controller.createCompany(req, res, next));
router.get('/companies', (req, res, next) => controller.listCompanies(req, res, next));
router.get('/companies/:id', (req, res, next) => controller.getCompanyDetail(req, res, next));
router.put('/companies/:id', (req, res, next) => controller.updateCompany(req, res, next));

// --- Endpoints de Delegación de Administradores ---
router.post('/companies/:id/admins', (req, res, next) => controller.assignAdmin(req, res, next));
router.delete('/companies/:id/admins/:adminId', (req, res, next) => controller.removeAdmin(req, res, next));

// --- Endpoints de Empleados ---
router.post('/companies/:id/employees/batch', (req, res, next) => controller.batchEmployees(req, res, next));
router.delete('/companies/:id/employees/:employeeId', (req, res, next) => controller.removeEmployee(req, res, next));

export default router;

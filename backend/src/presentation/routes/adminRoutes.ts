import { Router } from 'express';
import { CompanyController } from '../controllers/companyController';
import { CompanyService } from '../../application/services/companyService';
import { CompanyAdminService } from '../../application/services/companyAdminService';
import { CompanyEmployeeService } from '../../application/services/companyEmployeeService';
import { SequelizeCompanyRepository } from '../../infrastructure/repositories/SequelizeCompanyRepository';
import { SequelizeCompanyAdminRepository } from '../../infrastructure/repositories/SequelizeCompanyAdminRepository';
import { SequelizeCompanyEmployeeRepository } from '../../infrastructure/repositories/SequelizeCompanyEmployeeRepository';
import { SequelizeUserRepository } from '../../infrastructure/repositories/SequelizeUserRepository';
import { SequelizeAddressRepository } from '../../infrastructure/repositories/SequelizeAddressRepository';
import { requireAuth } from '../middlewares/authMiddleware';
import { requireRole, requireCompanyAccess } from '../middlewares/requireRole';
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
const addressRepo = new SequelizeAddressRepository();

const companyService = new CompanyService(companyRepo);
const companyAdminService = new CompanyAdminService(companyAdminRepo, userRepo, companyRepo, companyEmployeeRepo);
const companyEmployeeService = new CompanyEmployeeService(companyEmployeeRepo, companyRepo, companyAdminRepo, userRepo, addressRepo);

const controller = new CompanyController(companyService, companyAdminService, companyEmployeeService);

// Middleware de Autenticación y Limiter Global
router.use(requireAuth);
router.use(adminLimiter);

// --- Endpoints de Empresas ---
router.post('/companies', requireRole('admin_javiandas'), (req, res, next) => controller.createCompany(req, res, next));
router.get('/companies', requireRole('admin_javiandas'), (req, res, next) => controller.listCompanies(req, res, next));
router.get('/companies/:id', requireCompanyAccess, (req, res, next) => controller.getCompanyDetail(req, res, next));
router.put('/companies/:id', requireRole('admin_javiandas'), (req, res, next) => controller.updateCompany(req, res, next));

// --- Endpoints de Delegación de Administradores ---
router.post('/companies/:id/admins', requireCompanyAccess, (req, res, next) => controller.assignAdmin(req, res, next));
router.delete('/companies/:id/admins/:adminId', requireCompanyAccess, (req, res, next) => controller.removeAdmin(req, res, next));

// --- Endpoints de Empleados ---
router.post('/companies/:id/employees/batch', requireCompanyAccess, (req, res, next) => controller.batchEmployees(req, res, next));
router.delete('/companies/:id/employees/:employeeId', requireCompanyAccess, (req, res, next) => controller.removeEmployee(req, res, next));

export default router;


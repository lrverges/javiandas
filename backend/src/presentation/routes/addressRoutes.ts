import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middlewares/authMiddleware';
import { AddressController } from '../controllers/addressController';
import { AddressService } from '../../application/services/addressService';
import { SequelizeAddressRepository } from '../../infrastructure/repositories/SequelizeAddressRepository';
import { SequelizeUserRepository } from '../../infrastructure/repositories/SequelizeUserRepository';
import { SequelizeCompanyRepository } from '../../infrastructure/repositories/SequelizeCompanyRepository';
import { sequelize } from '../../infrastructure/database/sequelize';

const router = Router();

const addressLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 50 : 10000,
    message: { success: false, message: 'Too many requests, please try again later.', data: null }
});

const addressRepository = new SequelizeAddressRepository();
const userRepository = new SequelizeUserRepository();
const companyRepository = new SequelizeCompanyRepository();

const addressService = new AddressService(
    addressRepository,
    userRepository,
    companyRepository,
    sequelize
);

const addressController = new AddressController(addressService);

// Apply auth to all endpoints in this router
router.use(requireAuth);

router.get('/', (req, res, next) => addressController.list(req, res, next));
router.post('/', addressLimiter, (req, res, next) => addressController.create(req, res, next));
router.put('/:addressId', addressLimiter, (req, res, next) => addressController.update(req, res, next));
router.delete('/:addressId', addressLimiter, (req, res, next) => addressController.remove(req, res, next));
router.put('/:addressId/default', addressLimiter, (req, res, next) => addressController.setDefault(req, res, next));

export default router;

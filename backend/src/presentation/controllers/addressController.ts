import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AddressService } from '../../application/services/addressService';

const createAddressSchema = z.object({
    street: z.string().min(1, 'La calle es requerida'),
    number: z.string().min(1, 'El número es requerido'),
    locality: z.string().min(1, 'La localidad es requerida'),
    reference: z.string().optional()
});

const updateAddressSchema = z.object({
    street: z.string().min(1, 'La calle es requerida').optional(),
    number: z.string().min(1, 'El número es requerido').optional(),
    locality: z.string().min(1, 'La localidad es requerida').optional(),
    reference: z.string().optional()
});

export class AddressController {
    constructor(private addressService: AddressService) {}

    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'No autorizado', data: null });
                return;
            }

            const result = await this.addressService.listAddresses(userId);
            res.status(200).json({
                success: true,
                message: 'Direcciones obtenidas exitosamente',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'No autorizado', data: null });
                return;
            }

            const parsed = createAddressSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    message: parsed.error.issues[0].message,
                    data: null
                });
                return;
            }

            const result = await this.addressService.createAddress(userId, parsed.data);
            res.status(201).json({
                success: true,
                message: 'Dirección creada exitosamente',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'No autorizado', data: null });
                return;
            }

            const addressId = parseInt(req.params.addressId);
            if (isNaN(addressId)) {
                res.status(400).json({ success: false, message: 'ID de dirección inválido', data: null });
                return;
            }

            const parsed = updateAddressSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    message: parsed.error.issues[0].message,
                    data: null
                });
                return;
            }

            const result = await this.addressService.updateAddress(userId, addressId, parsed.data);
            res.status(200).json({
                success: true,
                message: 'Dirección actualizada exitosamente',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'No autorizado', data: null });
                return;
            }

            const addressId = parseInt(req.params.addressId);
            if (isNaN(addressId)) {
                res.status(400).json({ success: false, message: 'ID de dirección inválido', data: null });
                return;
            }

            await this.addressService.deleteAddress(userId, addressId);
            res.status(200).json({
                success: true,
                message: 'Dirección eliminada exitosamente',
                data: null
            });
        } catch (error) {
            next(error);
        }
    }

    async setDefault(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'No autorizado', data: null });
                return;
            }

            const addressId = parseInt(req.params.addressId);
            if (isNaN(addressId)) {
                res.status(400).json({ success: false, message: 'ID de dirección inválido', data: null });
                return;
            }

            const result = await this.addressService.setDefault(userId, addressId);
            res.status(200).json({
                success: true,
                message: 'Dirección predeterminada actualizada exitosamente',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IGoogleAuthProvider } from '../../domain/providers/IGoogleAuthProvider';
import { ICompanyEmployeeRepository } from '../../domain/repositories/ICompanyEmployeeRepository';
import { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import { IAddressRepository } from '../../domain/repositories/IAddressRepository';
import { User } from '../../domain/models/User';
import { Address } from '../../domain/models/Address';
import { EmailVerification } from '../../domain/models/EmailVerification';
import { IEmailVerificationRepository } from '../../domain/repositories/IEmailVerificationRepository';
import { IEmailService, NodemailerEmailService } from '../../infrastructure/email/EmailService';
import { Logger } from '../../infrastructure/logging/logger';
import { sequelize } from '../../infrastructure/database/sequelize';

export class AuthService {
    private static readonly DUMMY_HASH = '$2b$10$3tOiheoAkwkknfBAdFe0fOxsw1MhIxR41aPBNvPegHMajOrV/dCtm';

    constructor(
        private userRepository: IUserRepository,
        private googleAuthProvider: IGoogleAuthProvider,
        private companyEmployeeRepository: ICompanyEmployeeRepository,
        private companyRepository: ICompanyRepository,
        private addressRepository: IAddressRepository,
        private emailService: IEmailService = new NodemailerEmailService(),
        private emailVerificationRepository?: IEmailVerificationRepository
    ) {}

    private generateToken(user: User): string {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is missing.');
        }

        return jwt.sign(
            { userId: user.id, email: user.email },
            secret,
            { 
                expiresIn: '1h',
                issuer: 'javiandas-auth',
                audience: 'javiandas-frontend'
            }
        );
    }

    private generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async sendOtp(email: string): Promise<void> {
        if (!this.emailVerificationRepository) throw new Error('EmailVerificationRepository is required');

        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error('Email is already registered');
        }

        const otpCode = this.generateOTP();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        const verification = new EmailVerification({
            email,
            otpCode,
            expiresAt,
            verified: false
        });

        await this.emailVerificationRepository.upsert(verification);
        await this.emailService.sendOTP(email, otpCode);
    }

    async register(
        userData: User,
        addressData?: { street: string; number: string; locality: string; reference?: string }
    ): Promise<{ message: string; user: any; token: string }> {
        if (!this.emailVerificationRepository) throw new Error('EmailVerificationRepository is required');

        const verification = await this.emailVerificationRepository.findByEmail(userData.email);
        if (!verification || !verification.verified) {
            throw new Error('Email is not verified. Please verify your email first.');
        }

        const tx = await sequelize.transaction();
        try {
            const existingUser = await this.userRepository.findByEmail(userData.email);
            if (existingUser) {
                throw new Error('Email is already registered');
            }

            if (userData.password) {
                userData.password = await bcrypt.hash(userData.password, 10);
            }

            const employee = await this.companyEmployeeRepository.findByEmail(userData.email);
            let finalCompanyId: number | null = null;
            let companyAddress: { street: string; addressNumber: string; locality: string } | null = null;
            let allowExtra = false;

            if (employee && employee.status === 'pending') {
                const company = await this.companyRepository.findById(employee.companyId);
                if (company && company.isActive) {
                    finalCompanyId = company.id!;
                    
                    const hasValidAddress = Boolean(company.street && company.addressNumber && company.locality);
                    
                    if (hasValidAddress) {
                        allowExtra = company.allowExtraAddresses;
                        companyAddress = {
                            street: company.street,
                            addressNumber: company.addressNumber,
                            locality: company.locality
                        };
                    } else {
                        allowExtra = true;
                        companyAddress = null;
                    }
                }
            }

            userData.companyId = finalCompanyId;
            userData.isVerified = true; // El usuario nace verificado en este nuevo flujo

            const createdUser = await this.userRepository.create(userData, { transaction: tx });

            if (employee && finalCompanyId) {
                await this.companyEmployeeRepository.update(employee.id!, {
                    status: 'registered',
                    userId: createdUser.id
                }, { transaction: tx });
            }

            let finalAddress: Address;
            if (finalCompanyId && companyAddress && (!addressData || !allowExtra)) {
                finalAddress = new Address({
                    userId: createdUser.id!,
                    street: companyAddress.street,
                    number: companyAddress.addressNumber,
                    locality: companyAddress.locality,
                    reference: 'Dirección Corporativa',
                    isDefault: true
                });
            } else if (addressData) {
                finalAddress = new Address({
                    userId: createdUser.id!,
                    street: addressData.street,
                    number: addressData.number,
                    locality: addressData.locality,
                    reference: addressData.reference,
                    isDefault: true
                });
            } else if (finalCompanyId && !companyAddress && !addressData) {
                throw new Error('La empresa no tiene dirección configurada. Por favor, ingresa una dirección de entrega personalizada.');
            } else {
                throw new Error('Address is required for this registration');
            }

            await this.addressRepository.create(finalAddress, { transaction: tx });

            // Eliminar registro temporal de OTP
            await this.emailVerificationRepository.deleteByEmail(userData.email);

            await tx.commit();

            const token = this.generateToken(createdUser);

            return {
                message: 'Registration successful',
                token,
                user: {
                    id: createdUser.id,
                    email: createdUser.email,
                    name: createdUser.name,
                    role: createdUser.role,
                    companyId: createdUser.companyId,
                    firstName: createdUser.firstName,
                    lastName: createdUser.lastName,
                    phone: createdUser.phone,
                    dni: createdUser.dni,
                    isVerified: true
                }
            };
        } catch (error) {
            await tx.rollback();
            throw error;
        }
    }

    async verifyOtp(email: string, code: string): Promise<{
        isCorporate: boolean;
        companyId?: number | null;
        companyName?: string | null;
        benefitType?: string | null;
        allowExtraAddresses?: boolean;
    }> {
        if (!this.emailVerificationRepository) throw new Error('EmailVerificationRepository is required');

        const verification = await this.emailVerificationRepository.findByEmail(email);
        if (!verification) {
            throw new Error('No pending verification found for this email');
        }
        if (verification.verified) {
            // Already verified? We just return the corporate data if any
        } else {
            if (verification.otpCode !== code) {
                throw new Error('Invalid OTP code');
            }
            if (new Date() > verification.expiresAt) {
                throw new Error('OTP code has expired');
            }
            verification.verified = true;
            await this.emailVerificationRepository.upsert(verification);
        }

        // Consultar afiliación corporativa de manera segura después de verificar el correo
        const employee = await this.companyEmployeeRepository.findByEmail(email);
        if (!employee || employee.status !== 'pending') {
            return {
                isCorporate: false,
                companyId: null,
                companyName: null,
                benefitType: null,
                allowExtraAddresses: false
            };
        }

        const company = await this.companyRepository.findById(employee.companyId);
        if (!company || !company.isActive) {
            return {
                isCorporate: false,
                companyId: null,
                companyName: null,
                benefitType: null,
                allowExtraAddresses: false
            };
        }

        const hasCompanyAddress = Boolean(company.street && company.addressNumber && company.locality);

        return {
            isCorporate: true,
            companyId: company.id,
            companyName: company.name,
            benefitType: company.benefitType,
            allowExtraAddresses: company.allowExtraAddresses || !hasCompanyAddress
        };
    }

    async resendOtp(email: string): Promise<void> {
        if (!this.emailVerificationRepository) throw new Error('EmailVerificationRepository is required');

        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error('Email is already registered');
        }

        const otpCode = this.generateOTP();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        const verification = new EmailVerification({
            email,
            otpCode,
            expiresAt,
            verified: false
        });

        await this.emailVerificationRepository.upsert(verification);
        await this.emailService.sendOTP(email, otpCode);
    }

    async login(email: string, password: string): Promise<{ token: string; user: any } | null> {
        const user = await this.userRepository.findByEmail(email);
        
        if (!user || !user.password) {
            await bcrypt.compare(password, AuthService.DUMMY_HASH);
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }

        if (!user.isVerified) {
            throw new Error('Email is not verified');
        }

        const token = this.generateToken(user);

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                companyId: user.companyId,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                dni: user.dni,
                isVerified: user.isVerified
            },
        };
    }

    async loginWithGoogle(idToken: string): Promise<{ token: string; user: any } | null> {
        try {
            const payload = await this.googleAuthProvider.verifyIdToken(idToken);
            if (!payload) {
                return null;
            }

            const { email, name } = payload;

            let user = await this.userRepository.findByEmail(email);
            if (!user) {
                user = await this.userRepository.create(new User({ email, name, isVerified: true }));
            } else if (!user.isVerified) {
                // Si el usuario existía pero no estaba verificado, Google Auth lo verifica.
                await this.userRepository.update(user.id!, { isVerified: true, password: null });
                user.isVerified = true;
                user.password = undefined;
            }

            const token = this.generateToken(user);

            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    companyId: user.companyId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    dni: user.dni,
                    isVerified: user.isVerified
                },
            };
        } catch (error) {
            Logger.error('Error in loginWithGoogle:', error);
            return null;
        }
    }
}

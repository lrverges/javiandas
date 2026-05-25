export class User {
    id?: number;
    email: string;
    name: string;
    password?: string | null;
    role?: string;
    companyId?: number | null;
    firstName?: string;
    lastName?: string;
    phone?: string;
    dni?: string;
    isVerified?: boolean;

    constructor(data: { 
        id?: number; 
        email: string; 
        name?: string; 
        password?: string | null; 
        role?: string; 
        companyId?: number | null;
        firstName?: string;
        lastName?: string;
        phone?: string;
        dni?: string;
        isVerified?: boolean;
        otpCode?: string | null;
        otpExpiresAt?: Date | null;
    }) {
        this.id = data.id;
        this.email = data.email;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.name = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email;
        this.password = data.password;
        this.role = data.role || 'user';
        this.companyId = data.companyId || null;
        this.phone = data.phone;
        this.dni = data.dni;
        this.isVerified = data.isVerified !== undefined ? data.isVerified : false;
    }
}

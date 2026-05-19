export class CompanyAdmin {
    id?: number;
    companyId: number;
    userId?: number | null;
    email: string;
    status: 'active' | 'pending';
    createdAt?: Date;
    updatedAt?: Date;

    constructor(data: {
        id?: number;
        companyId: number;
        userId?: number | null;
        email: string;
        status?: 'active' | 'pending';
        createdAt?: Date;
        updatedAt?: Date;
    }) {
        this.id = data.id;
        this.companyId = data.companyId;
        this.userId = data.userId || null;
        this.email = data.email;
        this.status = data.status || 'pending';
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }
}

export class CompanyEmployee {
    id?: number;
    companyId: number;
    email: string;
    userId?: number | null;
    status: 'pending' | 'registered' | 'inactive';
    createdAt?: Date;
    updatedAt?: Date;

    constructor(data: {
        id?: number;
        companyId: number;
        email: string;
        userId?: number | null;
        status?: 'pending' | 'registered' | 'inactive';
        createdAt?: Date;
        updatedAt?: Date;
    }) {
        this.id = data.id;
        this.companyId = data.companyId;
        this.email = data.email;
        this.userId = data.userId || null;
        this.status = data.status || 'pending';
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }
}

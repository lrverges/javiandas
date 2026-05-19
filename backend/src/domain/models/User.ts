export class User {
    id?: number;
    email: string;
    name: string;
    password?: string;
    role?: string;
    companyId?: number | null;

    constructor(data: { id?: number, email: string, name: string, password?: string, role?: string, companyId?: number | null }) {
        this.id = data.id;
        this.email = data.email;
        this.name = data.name;
        this.password = data.password;
        this.role = data.role || 'user';
        this.companyId = data.companyId || null;
    }
}

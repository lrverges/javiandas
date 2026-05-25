declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                name: string;
                role: string;
                firstName?: string;
                lastName?: string;
                phone?: string;
                dni?: string;
                companyId?: number | null;
            };
        }
    }
}

export {};

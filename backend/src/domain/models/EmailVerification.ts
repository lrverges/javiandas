export class EmailVerification {
    email: string;
    otpCode: string;
    expiresAt: Date;
    verified: boolean;

    constructor(data: {
        email: string;
        otpCode: string;
        expiresAt: Date;
        verified?: boolean;
    }) {
        this.email = data.email;
        this.otpCode = data.otpCode;
        this.expiresAt = data.expiresAt;
        this.verified = data.verified || false;
    }
}

export class Address {
    id?: number;
    userId: number;
    street: string;
    number: string;
    locality: string;
    reference?: string;
    isDefault: boolean;

    constructor(data: {
        id?: number;
        userId: number;
        street: string;
        number: string;
        locality: string;
        reference?: string;
        isDefault?: boolean;
    }) {
        this.id = data.id;
        this.userId = data.userId;
        this.street = data.street;
        this.number = data.number;
        this.locality = data.locality;
        this.reference = data.reference;
        this.isDefault = data.isDefault !== undefined ? data.isDefault : true;
    }
}

import React from 'react';

export interface Address {
    id?: number;
    userId: number;
    street: string;
    number: string;
    locality: string;
    reference?: string;
    isDefault: boolean;
}

interface AddressCardProps {
    address: Address;
    onEdit: (address: Address) => void;
    onDelete: (addressId: number) => void;
    onSetDefault: (addressId: number) => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({
    address,
    onEdit,
    onDelete,
    onSetDefault,
}) => {
    return (
        <div className={`address-card ${address.isDefault ? 'is-default' : ''}`}>
            {address.isDefault && (
                <div className="address-badge-default">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    <span>Predeterminada</span>
                </div>
            )}

            <div className="address-details">
                <p className="address-line-main">
                    {address.street} {address.number}
                </p>
                <p className="address-line-sub">{address.locality}</p>
                {address.reference && (
                    <span className="address-reference">{address.reference}</span>
                )}
            </div>

            <div className="address-actions">
                {!address.isDefault ? (
                    <button
                        className="btn-action-primary"
                        onClick={() => address.id && onSetDefault(address.id)}
                    >
                        Establecer principal
                    </button>
                ) : (
                    <div style={{ flex: 1 }} />
                )}

                <button
                    className="btn-action-icon"
                    onClick={() => onEdit(address)}
                    title="Editar dirección"
                    aria-label="Editar dirección"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </button>

                <button
                    className="btn-action-icon delete"
                    onClick={() => address.id && onDelete(address.id)}
                    disabled={address.isDefault}
                    title={address.isDefault ? "No se puede eliminar la dirección predeterminada" : "Eliminar dirección"}
                    aria-label="Eliminar dirección"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import type { Address } from './AddressCard';

interface AddressFormProps {
    address?: Address | null; // If null/undefined, we are in Create mode
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { street: string; number: string; locality: string; reference?: string }) => Promise<void>;
}

export const AddressForm: React.FC<AddressFormProps> = ({
    address,
    isOpen,
    onClose,
    onSave,
}) => {
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [locality, setLocality] = useState('');
    const [reference, setReference] = useState('');

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (address) {
            setStreet(address.street);
            setNumber(address.number);
            setLocality(address.locality);
            setReference(address.reference || '');
        } else {
            setStreet('');
            setNumber('');
            setLocality('');
            setReference('');
        }
        setErrors({});
    }, [address, isOpen]);

    if (!isOpen) return null;

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!street.trim()) newErrors.street = 'La calle es requerida';
        if (!number.trim()) newErrors.number = 'El número es requerido';
        if (!locality.trim()) newErrors.locality = 'La localidad es requerida';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await onSave({
                street: street.trim(),
                number: number.trim(),
                locality: locality.trim(),
                reference: reference.trim() || undefined,
            });
            onClose();
        } catch (error: any) {
            setErrors({ submit: error.message || 'Error al guardar la dirección' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="address-modal-overlay" onClick={onClose}>
            <div className="address-modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{address ? 'Editar Dirección' : 'Agregar Dirección'}</h2>
                
                <form onSubmit={handleSubmit}>
                    {errors.submit && <div className="form-error submit-error">{errors.submit}</div>}

                    <div className="form-group">
                        <label htmlFor="street">Calle *</label>
                        <input
                            type="text"
                            id="street"
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            disabled={isSubmitting}
                        />
                        {errors.street && <span className="form-error">{errors.street}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="number">Número *</label>
                            <input
                                type="text"
                                id="number"
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                                disabled={isSubmitting}
                            />
                            {errors.number && <span className="form-error">{errors.number}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="locality">Localidad *</label>
                            <input
                                type="text"
                                id="locality"
                                value={locality}
                                onChange={(e) => setLocality(e.target.value)}
                                disabled={isSubmitting}
                            />
                            {errors.locality && <span className="form-error">{errors.locality}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="reference">Referencia / Info Adicional (opcional)</label>
                        <input
                            type="text"
                            id="reference"
                            placeholder="Ej: Depto 2B, Timbre negro, etc."
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-save"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

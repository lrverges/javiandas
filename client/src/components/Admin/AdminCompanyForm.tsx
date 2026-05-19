import React, { useState } from 'react';
import './AdminCompanyForm.css';

interface Company {
    id: number;
    name: string;
    cuit: string;
    street: string;
    addressNumber: string;
    locality: string;
    benefitType: 'Corporativo' | 'Corporativo Premium';
    allowExtraAddresses: boolean;
    isActive: boolean;
}

interface AdminCompanyFormProps {
    company: Company | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AdminCompanyForm({ company, onClose, onSuccess }: AdminCompanyFormProps) {
    const isEdit = !!company;
    const [name, setName] = useState(company?.name || '');
    const [cuit, setCuit] = useState(company?.cuit || '');
    const [street, setStreet] = useState(company?.street || '');
    const [addressNumber, setAddressNumber] = useState(company?.addressNumber || '');
    const [locality, setLocality] = useState(company?.locality || '');
    const [benefitType, setBenefitType] = useState<'Corporativo' | 'Corporativo Premium'>(company?.benefitType || 'Corporativo');
    const [allowExtraAddresses, setAllowExtraAddresses] = useState(company?.allowExtraAddresses || false);
    const [isActive, setIsActive] = useState(company?.isActive !== false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [serverError, setServerError] = useState('');

    const validateForm = () => {
        const tempErrors: Record<string, string> = {};
        
        if (name.trim().length < 2) {
            tempErrors.name = 'El nombre debe tener al menos 2 caracteres';
        }
        
        if (!isEdit) {
            const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
            if (!cuitRegex.test(cuit)) {
                tempErrors.cuit = 'CUIT inválido. Debe ser XX-XXXXXXXX-X';
            }
        }

        if (street.trim().length === 0) {
            tempErrors.street = 'La calle es requerida';
        }

        if (addressNumber.trim().length === 0) {
            tempErrors.addressNumber = 'El número es requerido';
        }

        if (locality.trim().length === 0) {
            tempErrors.locality = 'La localidad es requerida';
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSaving(true);
        setServerError('');

        const apiUrl = import.meta.env.VITE_API_URL;
        const payload: any = {
            name,
            street,
            addressNumber,
            locality,
            benefitType,
            allowExtraAddresses,
        };

        if (!isEdit) {
            payload.cuit = cuit;
        } else {
            payload.isActive = isActive;
        }

        try {
            const url = isEdit ? `${apiUrl}/admin/companies/${company!.id}` : `${apiUrl}/admin/companies`;
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            const data = await res.json();
            if (res.ok && data.success) {
                onSuccess();
            } else {
                setServerError(data.message || 'Ocurrió un error al guardar la empresa');
            }
        } catch (err: any) {
            setServerError('Error al conectar con el servidor');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{isEdit ? 'Editar Empresa Corporativa' : 'Nueva Empresa Corporativa'}</h2>
                    <button onClick={onClose} className="btn-close">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {serverError && <div className="error-banner">{serverError}</div>}

                    <div className="form-group">
                        <label htmlFor="company-name">Nombre de la Empresa</label>
                        <input
                            id="company-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={errors.name ? 'input-error' : ''}
                            placeholder="Ej. Acme Argentina S.A."
                            required
                        />
                        {errors.name && <span className="error-text">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="company-cuit">CUIT</label>
                        <input
                            id="company-cuit"
                            type="text"
                            value={cuit}
                            onChange={(e) => setCuit(e.target.value)}
                            disabled={isEdit}
                            className={errors.cuit ? 'input-error' : ''}
                            placeholder="Ej. 30-12345678-9"
                            required
                        />
                        {isEdit && <span className="helper-text">El CUIT de una empresa es inmutable.</span>}
                        {errors.cuit && <span className="error-text">{errors.cuit}</span>}
                    </div>

                    <h3 className="section-title">Dirección de Entrega Principal</h3>
                    
                    <div className="form-row">
                        <div className="form-group flex-2">
                            <label htmlFor="company-street">Calle</label>
                            <input
                                id="company-street"
                                type="text"
                                value={street}
                                onChange={(e) => setStreet(e.target.value)}
                                className={errors.street ? 'input-error' : ''}
                                placeholder="Ej. Av. de Mayo"
                                required
                            />
                            {errors.street && <span className="error-text">{errors.street}</span>}
                        </div>
                        <div className="form-group flex-1">
                            <label htmlFor="company-number">Número</label>
                            <input
                                id="company-number"
                                type="text"
                                value={addressNumber}
                                onChange={(e) => setAddressNumber(e.target.value)}
                                className={errors.addressNumber ? 'input-error' : ''}
                                placeholder="Ej. 1234"
                                required
                            />
                            {errors.addressNumber && <span className="error-text">{errors.addressNumber}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="company-locality">Localidad</label>
                        <input
                            id="company-locality"
                            type="text"
                            value={locality}
                            onChange={(e) => setLocality(e.target.value)}
                            className={errors.locality ? 'input-error' : ''}
                            placeholder="Ej. CABA"
                            required
                        />
                        {errors.locality && <span className="error-text">{errors.locality}</span>}
                    </div>

                    <h3 className="section-title">Beneficios & Permisos</h3>

                    <div className="form-group">
                        <label htmlFor="company-benefit">Tipo de Beneficio</label>
                        <select
                            id="company-benefit"
                            value={benefitType}
                            onChange={(e) => setBenefitType(e.target.value as any)}
                        >
                            <option value="Corporativo">Corporativo</option>
                            <option value="Corporativo Premium">Corporativo Premium</option>
                        </select>
                    </div>

                    <div className="form-group-checkbox">
                        <input
                            id="company-extra-addresses"
                            type="checkbox"
                            checked={allowExtraAddresses}
                            onChange={(e) => setAllowExtraAddresses(e.target.checked)}
                        />
                        <label htmlFor="company-extra-addresses">
                            Permitir que los empleados registren direcciones de entrega secundarias (Home-Office)
                        </label>
                    </div>

                    {isEdit && (
                        <div className="form-group-checkbox">
                            <input
                                id="company-active"
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                            />
                            <label htmlFor="company-active">Empresa Activa</label>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={isSaving}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSaving}>
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

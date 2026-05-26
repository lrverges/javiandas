import { useState, useEffect } from 'react';
import { AddressCard } from './AddressCard';
import type { Address } from './AddressCard';
import { AddressForm } from './AddressForm';
import './AddressManager.css';

export default function AddressManager() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

    // Form Modal State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    const apiUrl = import.meta.env.VITE_API_URL;

    const showToast = (message: string, isError = false) => {
        setToast({ message, isError });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchAddresses = async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${apiUrl}/users/me/addresses`, {
                credentials: 'include'
            });

            if (!res.ok) {
                throw new Error('Error al obtener tus direcciones.');
            }

            const data = await res.json();
            if (data.success) {
                // Sort default first, then by ID
                const sorted = [...data.data].sort((a, b) => {
                    if (a.isDefault && !b.isDefault) return -1;
                    if (!a.isDefault && b.isDefault) return 1;
                    return (a.id || 0) - (b.id || 0);
                });
                setAddresses(sorted);
            } else {
                setError(data.message || 'Error al cargar direcciones');
            }
        } catch (err: any) {
            setError(err.message || 'Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleSave = async (formData: { street: string; number: string; locality: string; reference?: string }) => {
        try {
            const method = editingAddress ? 'PUT' : 'POST';
            const path = editingAddress
                ? `/users/me/addresses/${editingAddress.id}`
                : '/users/me/addresses';

            const res = await fetch(`${apiUrl}${path}`, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Error al guardar la dirección');
            }

            showToast(editingAddress ? 'Dirección actualizada con éxito' : 'Dirección agregada con éxito');
            fetchAddresses();
        } catch (err: any) {
            showToast(err.message || 'Error al guardar', true);
            throw err; // Propagate to form to show local error
        }
    };

    const handleDelete = async (addressId: number) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta dirección?')) return;

        try {
            const res = await fetch(`${apiUrl}/users/me/addresses/${addressId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Error al eliminar la dirección');
            }

            showToast('Dirección eliminada con éxito');
            fetchAddresses();
        } catch (err: any) {
            showToast(err.message || 'Error al eliminar', true);
        }
    };

    const handleSetDefault = async (addressId: number) => {
        try {
            const res = await fetch(`${apiUrl}/users/me/addresses/${addressId}/default`, {
                method: 'PUT',
                credentials: 'include'
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Error al cambiar dirección principal');
            }

            showToast('Dirección principal actualizada');
            fetchAddresses();
        } catch (err: any) {
            showToast(err.message || 'Error al cambiar dirección principal', true);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingAddress(null);
        setIsFormOpen(true);
    };

    const handleOpenEditModal = (address: Address) => {
        setEditingAddress(address);
        setIsFormOpen(true);
    };

    return (
        <div className="address-manager-container">
            {toast && (
                <div className={`toast-notification ${toast.isError ? 'error' : ''}`}>
                    {toast.message}
                </div>
            )}

            <div className="address-manager-header">
                <div>
                    <h1>Mis Direcciones</h1>
                    <p style={{ color: 'var(--text)', margin: '4px 0 0 0', fontSize: '15px' }}>
                        Administrá tus ubicaciones para el envío de tus viandas saludables.
                    </p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="btn-add-address"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Agregar dirección
                </button>
            </div>

            {error && <div className="corporate-restriction-banner">{error}</div>}

            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                    <div className="spinner" style={{ borderTopColor: '#22c55e' }}></div>
                </div>
            ) : addresses.length === 0 ? (
                <div className="address-empty-state">
                    <div className="address-empty-icon">📍</div>
                    <p>No tenés ninguna dirección de entrega registrada.</p>
                    <button
                        onClick={handleOpenCreateModal}
                        className="btn-add-address"
                        style={{ margin: '0 auto' }}
                    >
                        Agregar mi primera dirección
                    </button>
                </div>
            ) : (
                <div className="addresses-grid">
                    {addresses.map((address) => (
                        <AddressCard
                            key={address.id}
                            address={address}
                            onEdit={handleOpenEditModal}
                            onDelete={handleDelete}
                            onSetDefault={handleSetDefault}
                        />
                    ))}
                </div>
            )}

            <AddressForm
                isOpen={isFormOpen}
                address={editingAddress}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSave}
            />
        </div>
    );
}

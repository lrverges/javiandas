import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminCompanyDetail.css';
import './AdminCompanyDetail.css';

interface CompanyAdmin {
    id: number;
    email: string;
    status: 'pending' | 'active';
    createdAt: string;
}

interface CompanyEmployee {
    id: number;
    email: string;
    status: 'pending' | 'registered';
    createdAt: string;
}

interface CompanyDetail {
    id: number;
    name: string;
    cuit: string;
    street: string;
    addressNumber: string;
    locality: string;
    benefitType: 'Corporativo' | 'Corporativo Premium';
    allowExtraAddresses: boolean;
    isActive: boolean;
    admins: CompanyAdmin[];
    employees: CompanyEmployee[];
}

interface BatchResult {
    added: string[];
    errors: { email: string; reason: string }[];
    summary: { total: number; successful: number; failed: number };
}

export default function AdminCompanyDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [company, setCompany] = useState<CompanyDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Admin delegation state
    const [adminEmail, setAdminEmail] = useState('');
    const [isAssigningAdmin, setIsAssigningAdmin] = useState(false);
    const [adminError, setAdminError] = useState('');

    // Employee batch state
    const [employeeEmails, setEmployeeEmails] = useState('');
    const [isUploadingEmployees, setIsUploadingEmployees] = useState(false);
    const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
    const [batchError, setBatchError] = useState('');

    // Custom Glassmorphic Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const apiUrl = import.meta.env.VITE_API_URL;

    const fetchCompanyDetail = async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${apiUrl}/admin/companies/${id}`, {
                credentials: 'include'
            });

            if (!res.ok) {
                if (res.status === 404) {
                    setError('La empresa solicitada no existe.');
                    return;
                }
                throw new Error('Error al obtener el detalle de la empresa');
            }

            const data = await res.json();
            if (data.success) {
                setCompany(data.data);
            } else {
                setError(data.message || 'Error desconocido');
            }
        } catch (err: any) {
            setError(err.message || 'Error de conexión con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchCompanyDetail();
        }
    }, [id]);

    const handleAssignAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminEmail.trim()) return;

        setIsAssigningAdmin(true);
        setAdminError('');
        try {
            const res = await fetch(`${apiUrl}/admin/companies/${id}/admins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: adminEmail.trim() }),
                credentials: 'include'
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setAdminEmail('');
                fetchCompanyDetail(); // Refresh data
            } else {
                setAdminError(data.message || 'Error al asignar administrador');
            }
        } catch (err) {
            setAdminError('Error de conexión con el servidor');
        } finally {
            setIsAssigningAdmin(false);
        }
    };

    const handleRemoveAdmin = async (adminId: number) => {
        showConfirmation(
            'Remover Administrador',
            '¿Está seguro de remover a este administrador corporativo?',
            async () => {
                try {
                    const res = await fetch(`${apiUrl}/admin/companies/${id}/admins/${adminId}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });

                    const data = await res.json();
                    if (res.ok && data.success) {
                        fetchCompanyDetail();
                    } else {
                        alert(data.message || 'Error al remover administrador');
                    }
                } catch (err) {
                    alert('Error de conexión al intentar remover administrador');
                }
            }
        );
    };

    const handleBatchUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeEmails.trim()) return;

        setIsUploadingEmployees(true);
        setBatchError('');
        setBatchResult(null);

        // Parse emails from textarea
        const emailsArray = employeeEmails
            .split(/[\n,;]+/)
            .map(email => email.trim())
            .filter(email => email.length > 0);

        if (emailsArray.length === 0) {
            setBatchError('Ingrese al menos un email válido.');
            setIsUploadingEmployees(false);
            return;
        }

        try {
            const res = await fetch(`${apiUrl}/admin/companies/${id}/employees/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails: emailsArray }),
                credentials: 'include'
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setEmployeeEmails('');
                setBatchResult(data.data);
                fetchCompanyDetail(); // Refresh list
            } else {
                setBatchError(data.message || 'Error al procesar la carga masiva');
            }
        } catch (err) {
            setBatchError('Error de conexión con el servidor');
        } finally {
            setIsUploadingEmployees(false);
        }
    };

    const handleRemoveEmployee = async (employeeId: number) => {
        showConfirmation(
            'Eliminar Pre-asignación',
            '¿Está seguro de eliminar esta pre-asignación de empleado?',
            async () => {
                try {
                    const res = await fetch(`${apiUrl}/admin/companies/${id}/employees/${employeeId}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });

                    const data = await res.json();
                    if (res.ok && data.success) {
                        fetchCompanyDetail();
                    } else {
                        alert(data.message || 'Error al eliminar pre-asignación de empleado');
                    }
                } catch (err) {
                    alert('Error de conexión al intentar eliminar pre-asignación de empleado');
                }
            }
        );
    };

    if (isLoading) {
        return (
            <div className="admin-layout">
                <div className="loader-container" style={{ margin: 'auto' }}>
                    <div className="spinner"></div>
                    <p>Cargando detalle de la empresa...</p>
                </div>
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className="admin-layout">
                <main className="admin-main">
                    {user?.role === 'admin_javiandas' && (
                        <button onClick={() => navigate('/admin/companies')} className="btn-secondary" style={{ marginBottom: '24px' }}>
                            &larr; Volver al Listado
                        </button>
                    )}
                    <div className="error-banner">{error || 'No se pudo cargar la empresa'}</div>
                </main>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <main className="admin-main">
                {user?.role === 'admin_javiandas' && (
                    <button onClick={() => navigate('/admin/companies')} className="btn-back">
                        &larr; Volver al Listado
                    </button>
                )}

                <div className="detail-hero-card">
                    <div className="hero-header">
                        <div className="hero-title-section">
                            <h1>{company.name}</h1>
                            <div className="hero-badges">
                                <span className={`badge-benefit ${company.benefitType.replace(' ', '-').toLowerCase()}`}>
                                    {company.benefitType}
                                </span>
                                <span className={`badge-status ${company.isActive ? 'active' : 'inactive'}`}>
                                    {company.isActive ? 'Activa' : 'Inactiva'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-info-grid">
                        <div className="info-item">
                            <span className="info-label">CUIT</span>
                            <span className="info-value"><code>{company.cuit}</code></span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Dirección Principal</span>
                            <span className="info-value">{`${company.street} ${company.addressNumber}, ${company.locality}`}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Direcciones Extra</span>
                            <span className="info-value">{company.allowExtraAddresses ? 'Permitido' : 'No Permitido'}</span>
                        </div>
                    </div>
                </div>

                <div className="detail-sections-grid">
                    {/* Admins section */}
                    <section className="detail-card">
                        <h2>Administradores de Empresa</h2>
                        <p className="section-desc">Usuarios delegados que administran los pedidos corporativos de esta empresa.</p>

                        <form onSubmit={handleAssignAdmin} className="mini-form">
                            <input
                                type="email"
                                placeholder="Email del nuevo administrador..."
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                required
                                className="input-search"
                            />
                            <button type="submit" disabled={isAssigningAdmin} className="btn-primary">
                                {isAssigningAdmin ? 'Asignando...' : 'Asignar'}
                            </button>
                        </form>
                        {adminError && <div className="error-text" style={{ marginTop: '8px' }}>{adminError}</div>}

                        <div className="list-container" style={{ marginTop: '24px' }}>
                            {company.admins.length === 0 ? (
                                <p className="empty-text">No hay administradores asignados.</p>
                            ) : (
                                <ul className="item-list">
                                    {company.admins.map((admin) => (
                                        <li key={admin.id} className="item-row">
                                            <div className="item-info">
                                                <span className="item-title">{admin.email}</span>
                                                <span className={`badge-status ${admin.status}`}>
                                                    {admin.status === 'active' ? 'Activo' : 'Pendiente'}
                                                </span>
                                            </div>
                                            <button onClick={() => handleRemoveAdmin(admin.id)} className="btn-danger-link">
                                                Remover
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>

                    {/* Employees Section */}
                    <section className="detail-card">
                        <h2>Pre-asignación de Empleados</h2>
                        <p className="section-desc">Carga masiva y administración de empleados autorizados para pedir viandas corporativas.</p>

                        <form onSubmit={handleBatchUpload} className="batch-upload-form">
                            <label htmlFor="employees-textarea">Ingresar lista de emails (separados por coma, punto y coma o salto de línea):</label>
                            <textarea
                                id="employees-textarea"
                                rows={4}
                                placeholder="empleado1@empresa.com&#10;empleado2@empresa.com"
                                value={employeeEmails}
                                onChange={(e) => setEmployeeEmails(e.target.value)}
                                required
                            />
                            <button type="submit" disabled={isUploadingEmployees} className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '12px' }}>
                                {isUploadingEmployees ? 'Cargando...' : 'Cargar Empleados'}
                            </button>
                        </form>
                        {batchError && <div className="error-text" style={{ marginTop: '8px' }}>{batchError}</div>}

                        {batchResult && (
                            <div className="batch-result-card">
                                <h4>Resultado de la Carga</h4>
                                <div className="batch-summary">
                                    <span>Total: <strong>{batchResult.summary.total}</strong></span>
                                    <span>Exitosos: <strong className="text-success">{batchResult.summary.successful}</strong></span>
                                    <span>Fallidos: <strong className="text-danger">{batchResult.summary.failed}</strong></span>
                                </div>
                                {batchResult.errors.length > 0 && (
                                    <div className="batch-errors-list">
                                        <h5>Detalle de errores:</h5>
                                        <ul>
                                            {batchResult.errors.map((err, i) => (
                                                <li key={i}>
                                                    <code>{err.email}</code>: {err.reason}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="list-container" style={{ marginTop: '24px' }}>
                            <h3>Empleados Cargados ({company.employees.length})</h3>
                            {company.employees.length === 0 ? (
                                <p className="empty-text">No hay empleados vinculados.</p>
                            ) : (
                                <ul className="item-list">
                                    {company.employees.map((emp) => (
                                        <li key={emp.id} className="item-row">
                                            <div className="item-info">
                                                <span className="item-title">{emp.email}</span>
                                                <span className={`badge-status ${emp.status}`}>
                                                    {emp.status === 'registered' ? 'Registrado' : 'Pendiente'}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveEmployee(emp.id)} 
                                                className="btn-danger-link"
                                                disabled={emp.status === 'registered'}
                                                title={emp.status === 'registered' ? 'No se puede eliminar un empleado registrado en el sistema' : ''}
                                            >
                                                Remover
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            {confirmModal.isOpen && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-card">
                        <h3>{confirmModal.title}</h3>
                        <p>{confirmModal.message}</p>
                        <div className="custom-modal-actions">
                            <button 
                                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
                                className="btn-modal-cancel"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmModal.onConfirm} 
                                className="btn-modal-confirm"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

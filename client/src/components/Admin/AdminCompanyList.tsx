import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminCompanyForm from './AdminCompanyForm';
import logo from '../../assets/Logo JA VIANDAS_SF.png';
import './AdminCompanyList.css';

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
    createdAt: string;
    updatedAt: string;
}

export default function AdminCompanyList() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [benefitType, setBenefitType] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Form modal state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);

    const apiUrl = import.meta.env.VITE_API_URL;

    const fetchCompanies = async () => {
        setIsLoading(true);
        setError('');
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                benefitType
            });
            const res = await fetch(`${apiUrl}/admin/companies?${queryParams}`, {
                credentials: 'include'
            });

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    setError('Acceso denegado. Privilegios insuficientes.');
                    return;
                }
                throw new Error('Error al obtener el listado de empresas');
            }

            const data = await res.json();
            if (data.success) {
                setCompanies(data.data.companies);
                setTotal(data.data.total);
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
        fetchCompanies();
    }, [page, search, benefitType]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1); // Reset page to 1
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setBenefitType(e.target.value);
        setPage(1); // Reset page to 1
    };

    const handleOpenCreateModal = () => {
        setEditingCompany(null);
        setIsFormOpen(true);
    };

    const handleOpenEditModal = (company: Company, e: React.MouseEvent) => {
        e.stopPropagation(); // Avoid navigating to details
        setEditingCompany(company);
        setIsFormOpen(true);
    };

    const handleSaveSuccess = () => {
        setIsFormOpen(false);
        fetchCompanies();
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="admin-layout">
            <main className="admin-main">
                <div className="page-header">
                    <div className="title-section">
                        <h1>Empresas Corporativas</h1>
                        <p className="subtitle">Gestión e integración de clientes corporativos B2B.</p>
                    </div>
                    <button onClick={handleOpenCreateModal} className="btn-primary">
                        + Nueva Empresa
                    </button>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="table-controls">
                    <div className="search-wrapper">
                        <input
                            type="text"
                            placeholder="Buscar por Nombre o CUIT..."
                            value={search}
                            onChange={handleSearchChange}
                            className="input-search"
                        />
                    </div>
                    <div className="filter-wrapper">
                        <select value={benefitType} onChange={handleFilterChange} className="select-filter">
                            <option value="">Todos los beneficios</option>
                            <option value="Corporativo">Corporativo</option>
                            <option value="Corporativo Premium">Corporativo Premium</option>
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="loader-container">
                        <div className="spinner"></div>
                        <p>Cargando empresas...</p>
                    </div>
                ) : companies.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🏢</div>
                        <h3>No se encontraron empresas</h3>
                        <p>Comienza creando tu primera empresa corporativa.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>CUIT</th>
                                    <th>Dirección Principal</th>
                                    <th>Beneficio</th>
                                    <th>Direcciones Extra</th>
                                    <th>Estado</th>
                                    <th className="actions-header">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.map((company) => (
                                    <tr 
                                        key={company.id} 
                                        onClick={() => navigate(`/admin/companies/${company.id}`)}
                                        className="clickable-row"
                                    >
                                        <td className="company-name">{company.name}</td>
                                        <td><code>{company.cuit}</code></td>
                                        <td>{`${company.street} ${company.addressNumber}, ${company.locality}`}</td>
                                        <td>
                                            <span className={`badge-benefit ${company.benefitType.replace(' ', '-').toLowerCase()}`}>
                                                {company.benefitType}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge-bool ${company.allowExtraAddresses ? 'yes' : 'no'}`}>
                                                {company.allowExtraAddresses ? 'Permitido' : 'No Permitido'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge-status ${company.isActive ? 'active' : 'inactive'}`}>
                                                {company.isActive ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button 
                                                    onClick={(e) => handleOpenEditModal(company, e)} 
                                                    className="btn-secondary"
                                                >
                                                    Editar
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/companies/${company.id}`); }}
                                                    className="btn-accent"
                                                >
                                                    Detalle
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                                    disabled={page === 1}
                                    className="btn-pagination"
                                >
                                    Anterior
                                </button>
                                <span className="page-indicator">
                                    Página <strong>{page}</strong> de {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                                    disabled={page === totalPages}
                                    className="btn-pagination"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {isFormOpen && (
                <AdminCompanyForm
                    company={editingCompany}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={handleSaveSuccess}
                />
            )}
        </div>
    );
}

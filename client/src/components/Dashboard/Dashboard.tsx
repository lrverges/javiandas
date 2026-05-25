import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="dashboard-container">
            <div className="dashboard-content">
                <h1>Dashboard de Viandas Saludables 🥗</h1>
                <h2>Bienvenido, {user?.name || 'Usuario'}</h2>
                
                <div className="user-info-card">
                    <div className="info-label">Email:</div>
                    <div className="info-value">{user?.email}</div>
                    
                    <div className="info-label">Rol:</div>
                    <div className="info-value">
                        <span className="role-badge">{user?.role}</span>
                    </div>
                </div>
                
                <div className="welcome-banner">
                    <p>🎉 Has iniciado sesión correctamente de forma segura mediante Cookies HttpOnly.</p>
                </div>

                {user?.role === 'admin_javiandas' && (
                    <div className="admin-access-section" style={{ marginTop: '24px', textAlign: 'center' }}>
                        <button 
                            onClick={() => navigate('/admin/companies')} 
                            className="btn-primary"
                            style={{ 
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                padding: '12px 32px',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#059669';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = '#10b981';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            Ir al Panel de Administración B2B 🏢
                        </button>
                    </div>
                )}

                {user?.role === 'admin_empresa' && user.companyId && (
                    <div className="admin-access-section" style={{ marginTop: '24px', textAlign: 'center' }}>
                        <button 
                            onClick={() => navigate(`/admin/companies/${user.companyId}`)} 
                            className="btn-primary"
                            style={{ 
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                padding: '12px 32px',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#059669';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = '#10b981';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            Administrar Usuarios de la Empresa 🏢
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

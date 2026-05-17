import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Dashboard de Viandas Saludables 🥗</h1>
                <button onClick={handleLogout} className="logout-btn">
                    Cerrar Sesión
                </button>
            </div>
            
            <div className="dashboard-content">
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
            </div>
        </div>
    );
}

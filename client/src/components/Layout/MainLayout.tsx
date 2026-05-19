import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/Logo JA VIANDAS_SF.png';
import './MainLayout.css';

export default function MainLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentPath = location.pathname;
    const isAdmin = user?.role === 'admin_javiandas';

    return (
        <div className="app-layout">
            <header className="app-header">
                <div className="header-brand" onClick={() => navigate('/dashboard')}>
                    <img src={logo} alt="Logo JA Viandas" className="header-logo" />
                    <span className="header-title">
                        <span className="title-brand">JA VIANDAS</span>
                        <span className="title-sub">SALUDABLES</span>
                    </span>
                </div>
                
                <div className="header-right-area">
                    {/* Switch de modo claro / oscuro */}
                    <div className="theme-toggle-container">
                        <button 
                            className="theme-toggle-btn" 
                            onClick={toggleTheme}
                            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                            aria-label="Toggle Theme"
                        >
                            <div className="theme-toggle-track">
                                <div className="theme-toggle-thumb">
                                    {theme === 'dark' ? (
                                        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="theme-icon moon">
                                            <path d="M12.3 22h-.1c-5.5 0-10-4.5-10-10 0-4.8 3.5-8.9 8.2-9.8.5-.1 1 .2 1.2.7.2.5 0 1.1-.4 1.4-2.8 2.2-4.5 5.6-4.5 9.2 0 4.8 3.6 8.8 8.4 9.4.5.1.9.5 1 1 .1.5-.1 1-.6 1.2-.2.1-.5.1-.7.1zm-1.8-17.7c-3.1 1.2-5.1 4.2-5.1 7.6 0 4.2 3.2 7.8 7.4 8.2-1.3-1.6-2-3.7-2-5.9 0-4.2 2.7-7.8 6.7-9-2.5-.7-5.1-.4-7 .9z" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="theme-icon sun">
                                            <circle cx="12" cy="12" r="5" fill="currentColor" />
                                            <line x1="12" y1="1" x2="12" y2="3" />
                                            <line x1="12" y1="21" x2="12" y2="23" />
                                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                            <line x1="1" y1="12" x2="3" y2="12" />
                                            <line x1="21" y1="12" x2="23" y2="12" />
                                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Menú de Usuario */}
                    <div className="header-user-menu" ref={dropdownRef}>
                        <button 
                            className={`profile-trigger ${dropdownOpen ? 'active' : ''}`}
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        >
                            <span className="user-name">{user?.name || 'Usuario'}</span>
                            <div className="user-avatar">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="avatar-svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M7.12891 17.5C7.62174 15.6522 9.42907 14 11.9997 14C14.5704 14 16.3777 15.6522 16.8705 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`chevron-svg ${dropdownOpen ? 'open' : ''}`}>
                                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        {dropdownOpen && (
                            <div className="dropdown-menu">
                                <div className="dropdown-user-info">
                                    <p className="dropdown-name">{user?.name}</p>
                                    <p className="dropdown-email">{user?.email}</p>
                                    <span className="dropdown-role">{user?.role === 'admin_javiandas' ? 'Super Admin' : 'Usuario'}</span>
                                </div>
                                <div className="dropdown-divider"></div>
                                <button onClick={handleLogout} className="dropdown-item logout-item">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="item-icon">
                                        <path d="M17 16L21 12M21 12L17 8M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M9 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                    Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <div className="layout-body">
                <aside className="app-sidebar">
                    <nav className="sidebar-nav">
                        <button 
                            className={`nav-item ${currentPath === '/dashboard' ? 'active' : ''}`}
                            onClick={() => navigate('/dashboard')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="nav-icon">
                                <path d="M3 12L12 3L21 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M9 21V12H15V21H9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                            </svg>
                            <span>Dashboard</span>
                        </button>
                        {isAdmin && (
                            <button 
                                className={`nav-item ${currentPath.startsWith('/admin') ? 'active' : ''}`}
                                onClick={() => navigate('/admin/companies')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="nav-icon">
                                    <path d="M3 21H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    <path d="M5 21V7L12 3L19 7V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M9 11H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    <path d="M9 15H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    <path d="M13 11H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    <path d="M13 15H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <span>Administración B2B</span>
                            </button>
                        )}
                    </nav>
                </aside>
                <main className="layout-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';
import logo from '../assets/Logo JA VIANDAS_SF.png';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
        setError('');
        setInfo('');
        const idToken = response.credential;
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const res = await fetch(`${apiUrl}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                console.log('Login success:', data);
                login(data.data.user);
                navigate('/dashboard');
            } else {
                setError(data.message || 'Error en login con Google');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        }
    }, [login, navigate]);

    const googleInitialized = useRef(false);

    useEffect(() => {
        // Inicializar el botón de Google solo si no se ha inicializado
        if (typeof window.google !== 'undefined' && !googleInitialized.current) {
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            if (!clientId) {
                console.error('VITE_GOOGLE_CLIENT_ID no está definido en el archivo .env');
            } else {
                googleInitialized.current = true;
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleGoogleResponse,
                });
                
                // Renderizar el botón
                const googleBtn = document.getElementById('google-btn');
                if (googleBtn) {
                    window.google.accounts.id.renderButton(
                        googleBtn,
                        { theme: 'outline', size: 'large', width: 350 }
                    );
                }
            }
        }
    }, [handleGoogleResponse]);

    const handleTraditionalLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setInfo('');
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const res = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                console.log('Login success:', data);
                login(data.data.user);
                navigate('/dashboard');
            } else {
                if (res.status === 403 && data.message === 'Email is not verified') {
                    navigate('/verify-email', { state: { email } });
                    return;
                }
                setError(data.message || 'Credenciales inválidas');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        }
    };

    return (
        <div className="login-container">
            <div className="login-left-panel">
                <div className="brand-content">
                    <img src={logo} alt="Logo Viandas Saludables" className="big-logo" />
                </div>
            </div>
            <div className="login-right-panel">
                <div className="login-box">
                    <h2>Iniciar Sesión</h2>
                    <p className="subtitle">Bienvenido de nuevo</p>
                    
                    <form onSubmit={handleTraditionalLogin}>
                        <div className="form-group">
                            <label>Correo Electrónico</label>
                            <input 
                                type="email" 
                                placeholder="tu@email.com"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>Contraseña</label>
                            <input 
                                type="password" 
                                placeholder="••••••••"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                        </div>
                        
                        {error && <div className="error-alert">{error}</div>}
                        {info && <div className="info-alert">{info}</div>}
                        
                        <button type="submit" className="login-submit-btn">
                            Entrar
                        </button>
                    </form>
                    
                    <div className="divider">
                        <span>o</span>
                    </div>
                    
                    <div id="google-btn" className="google-btn-container"></div>
                    
                    <p className="footer-text">
                        ¿No tienes cuenta?{' '}
                        <span 
                            className="link" 
                            onClick={() => navigate('/register')}
                        >
                            Regístrate
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

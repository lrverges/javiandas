import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/Logo JA VIANDAS_SF.png';
import './Register.css';

export default function VerifyEmail() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // We expect the email to be passed via state from Register.tsx, but allow manual input if not
    const [email, setEmail] = useState(location.state?.email || '');
    const isEmailFixed = !!location.state?.email;

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (code.length !== 6) {
            setError('El código debe tener 6 dígitos');
            return;
        }

        setIsLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const res = await fetch(`${apiUrl}/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
                credentials: 'include',
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setSuccessMessage('¡Correo verificado con éxito!');
                setTimeout(() => {
                    login(data.data.user);
                    navigate('/dashboard');
                }, 1500);
            } else {
                setError(data.message || 'Código inválido o expirado');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const res = await fetch(`${apiUrl}/auth/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setSuccessMessage('Nuevo código enviado. Revisa tu correo.');
            } else {
                setError(data.message || 'Error al reenviar el código');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    // No longer returning null if !email, we render the input instead

    return (
        <div className="register-container">
            <div className="register-left-panel">
                <div className="brand-content">
                    <img src={logo} alt="Logo Viandas Saludables" className="big-logo" />
                </div>
            </div>
            
            <div className="register-right-panel">
                <div className="register-box">
                    <h2>Verificación de Correo</h2>
                    <p className="subtitle">
                        {isEmailFixed ? (
                            <>Hemos enviado un código de 6 dígitos a <strong>{email}</strong></>
                        ) : (
                            <>Ingresa tu correo y el código de verificación que te enviamos.</>
                        )}
                    </p>

                    <form onSubmit={handleVerify}>
                        {!isEmailFixed && (
                            <div className="form-group">
                                <label>Correo Electrónico</label>
                                <input
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        )}
                        <div className="form-group" style={{ textAlign: 'center' }}>
                            <label>Código de Verificación</label>
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                required
                                disabled={isLoading}
                                style={{ 
                                    fontSize: '24px', 
                                    letterSpacing: '10px', 
                                    textAlign: 'center',
                                    padding: '15px' 
                                }}
                            />
                        </div>

                        {error && <div className="error-alert">{error}</div>}
                        {successMessage && <div className="success-alert" style={{ color: 'green', marginBottom: '15px', textAlign: 'center' }}>{successMessage}</div>}

                        <button type="submit" className="register-submit-btn" disabled={isLoading || code.length !== 6 || !email}>
                            {isLoading ? 'Verificando...' : 'Verificar'}
                        </button>
                    </form>

                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <p className="footer-text">
                            ¿No recibiste el código?{' '}
                            <button 
                                type="button" 
                                className="link" 
                                onClick={handleResend}
                                disabled={isLoading || !email}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
                            >
                                Reenviar código
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/Logo JA VIANDAS_SF.png';
import './Register.css';

export default function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();

    // Flujo
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Step 1: Datos del email
    const [email, setEmail] = useState('');
    
    // Step 2: OTP
    const [code, setCode] = useState('');

    // Step 3: Datos de empresa y personales
    const [isCorporate, setIsCorporate] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [benefitType, setBenefitType] = useState('');
    const [allowExtraAddresses, setAllowExtraAddresses] = useState(false);

    // Formulario Registro (Paso 3)
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [dni, setDni] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Dirección (Particular o Corporativa Personalizada)
    const [useCustomAddress, setUseCustomAddress] = useState(false);
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [locality, setLocality] = useState('');
    const [reference, setReference] = useState('');

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const res = await fetch(`${apiUrl}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setSuccessMessage('¡Código OTP enviado!');
                setTimeout(() => {
                    setSuccessMessage('');
                    setStep(2);
                }, 1500);
            } else {
                setError(data.message || 'Error al enviar el código');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
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
            const res = await fetch(`${apiUrl}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
                credentials: 'include',
            });
            const data = await res.json();

            if (res.ok && data.success) {
                const info = data.data;
                setIsCorporate(info.isCorporate);
                setCompanyName(info.companyName || '');
                setBenefitType(info.benefitType || '');
                setAllowExtraAddresses(info.allowExtraAddresses || false);
                setStep(3);
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

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setIsLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            
            // Armamos el objeto dirección si aplica
            let addressPayload = undefined;
            if (!isCorporate || (allowExtraAddresses && useCustomAddress)) {
                if (!street || !number || !locality) {
                    setError('La dirección de entrega es obligatoria');
                    setIsLoading(false);
                    return;
                }
                addressPayload = {
                    street,
                    number,
                    locality,
                    reference: reference || undefined
                };
            }

            const payload = {
                email,
                password,
                firstName,
                lastName,
                phone,
                dni,
                address: addressPayload
            };

            const res = await fetch(`${apiUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include',
            });
            const data = await res.json();

            if (res.ok && data.success) {
                console.log('Registro exitoso:', data);
                setSuccessMessage('¡Registro exitoso!');
                setTimeout(() => {
                    login(data.data.user);
                    navigate('/dashboard');
                }, 1500);
            } else {
                setError(data.message || 'Error al procesar el registro');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="register-left-panel">
                <div className="brand-content">
                    <img src={logo} alt="Logo Viandas Saludables" className="big-logo" />
                </div>
            </div>
            
            <div className="register-right-panel">
                <div className="register-box">
                    <h2>Registro de Usuario</h2>
                    <p className="subtitle">
                        {step === 1 && 'Comencemos con tu correo electrónico'}
                        {step === 2 && <>Hemos enviado un código a <strong>{email}</strong></>}
                        {step === 3 && 'Completa tus datos personales para finalizar'}
                    </p>

                    {error && <div className="error-alert">{error}</div>}
                    {successMessage && <div className="success-alert" style={{ color: 'green', marginBottom: '15px', textAlign: 'center' }}>{successMessage}</div>}

                    {step === 1 && (
                        <form onSubmit={handleSendOtp}>
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

                            <button type="submit" className="register-submit-btn" disabled={isLoading || !email}>
                                {isLoading ? 'Enviando OTP...' : 'Siguiente'}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifyOtp}>
                            <div className="form-group" style={{ textAlign: 'center' }}>
                                <label>Código OTP</label>
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

                            <div className="button-group">
                                <button type="button" className="register-back-btn" disabled={isLoading} onClick={() => setStep(1)}>
                                    Atrás
                                </button>
                                <button type="submit" className="register-submit-btn" disabled={isLoading || code.length !== 6}>
                                    {isLoading ? 'Verificando...' : 'Verificar'}
                                </button>
                            </div>
                            
                            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                <p className="footer-text">
                                    ¿No recibiste el código?{' '}
                                    <button 
                                        type="button" 
                                        className="link" 
                                        onClick={handleResend}
                                        disabled={isLoading}
                                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
                                    >
                                        Reenviar código
                                    </button>
                                </p>
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleRegister}>
                            <input
                                type="email"
                                name="username"
                                value={email}
                                style={{ display: 'none' }}
                                readOnly
                                autoComplete="username"
                            />
                            
                            {/* Banner Corporativo */}
                            {isCorporate && (
                                <div className="corporate-banner">
                                    <div className="banner-title">¡Correo Corporativo Detectado!</div>
                                    <div className="banner-desc">
                                        Perteneces a <strong>{companyName}</strong> ({benefitType}).
                                    </div>
                                </div>
                            )}

                            {/* Datos Personales en Grid */}
                            <div className="form-row">
                                <div className="form-group col-6">
                                    <label>Nombre</label>
                                    <input
                                        type="text"
                                        placeholder="Juan"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="form-group col-6">
                                    <label>Apellido</label>
                                    <input
                                        type="text"
                                        placeholder="Pérez"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group col-6">
                                    <label>Teléfono</label>
                                    <input
                                        type="tel"
                                        placeholder="1122334455"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="form-group col-6">
                                    <label>DNI</label>
                                    <input
                                        type="text"
                                        placeholder="12345678"
                                        value={dni}
                                        onChange={(e) => setDni(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            {/* Contraseña */}
                            <div className="form-row">
                                <div className="form-group col-6">
                                    <label>Contraseña</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                    />
                                </div>
                                <div className="form-group col-6">
                                    <label>Confirmar Contraseña</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            {/* Gestión de Dirección según tipo de usuario */}
                            {isCorporate ? (
                                <>
                                    {allowExtraAddresses ? (
                                        <div className="address-choice-section">
                                            <div className="checkbox-container">
                                                <input
                                                    type="checkbox"
                                                    id="useCustomAddress"
                                                    checked={useCustomAddress}
                                                    onChange={(e) => setUseCustomAddress(e.target.checked)}
                                                    disabled={isLoading}
                                                />
                                                <label htmlFor="useCustomAddress">
                                                    Deseo recibir mis viandas en una dirección personalizada en lugar de la empresa
                                                </label>
                                            </div>

                                            {useCustomAddress && (
                                                <div className="address-fields animated-fade-in">
                                                    <div className="form-row">
                                                        <div className="form-group col-8">
                                                            <label>Calle</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Av. Santa Fe"
                                                                value={street}
                                                                onChange={(e) => setStreet(e.target.value)}
                                                                required={useCustomAddress}
                                                                disabled={isLoading}
                                                            />
                                                        </div>
                                                        <div className="form-group col-4">
                                                            <label>Número</label>
                                                            <input
                                                                type="text"
                                                                placeholder="1234"
                                                                value={number}
                                                                onChange={(e) => setNumber(e.target.value)}
                                                                required={useCustomAddress}
                                                                disabled={isLoading}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="form-row">
                                                        <div className="form-group col-6">
                                                            <label>Localidad</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Palermo"
                                                                value={locality}
                                                                onChange={(e) => setLocality(e.target.value)}
                                                                required={useCustomAddress}
                                                                disabled={isLoading}
                                                            />
                                                        </div>
                                                        <div className="form-group col-6">
                                                            <label>Referencia (Opcional)</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Piso 3, Dpto B"
                                                                value={reference}
                                                                onChange={(e) => setReference(e.target.value)}
                                                                disabled={isLoading}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="address-info-banner">
                                            Tus viandas serán entregadas en la dirección de la empresa según el plan corporativo.
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="address-section">
                                    <h3 className="section-title">Dirección de Entrega</h3>
                                    <div className="address-fields">
                                        <div className="form-row">
                                            <div className="form-group col-8">
                                                <label>Calle</label>
                                                <input
                                                    type="text"
                                                    placeholder="Av. Santa Fe"
                                                    value={street}
                                                    onChange={(e) => setStreet(e.target.value)}
                                                    required
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            <div className="form-group col-4">
                                                <label>Número</label>
                                                <input
                                                    type="text"
                                                    placeholder="1234"
                                                    value={number}
                                                    onChange={(e) => setNumber(e.target.value)}
                                                    required
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group col-6">
                                                <label>Localidad</label>
                                                <input
                                                    type="text"
                                                    placeholder="Palermo"
                                                    value={locality}
                                                    onChange={(e) => setLocality(e.target.value)}
                                                    required
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            <div className="form-group col-6">
                                                <label>Referencia (Opcional)</label>
                                                <input
                                                    type="text"
                                                    placeholder="Piso 3, Dpto B"
                                                    value={reference}
                                                    onChange={(e) => setReference(e.target.value)}
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="button-group" style={{ marginTop: '20px' }}>
                                <button 
                                    type="button" 
                                    className="register-back-btn" 
                                    disabled={isLoading} 
                                    onClick={() => setStep(2)}
                                >
                                    Atrás
                                </button>
                                <button type="submit" className="register-submit-btn" disabled={isLoading}>
                                    {isLoading ? 'Registrando...' : 'Completar Registro'}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="register-footer">
                        ¿Ya tienes una cuenta? <span className="link" onClick={() => navigate('/login')}>Inicia Sesión</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

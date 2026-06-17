import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AntigravityParticles from '../components/AntigravityParticles';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const user = await login(username, password);
            if (user.role === 'admin' || user.role === 'ceo' || user.role === 'developer') {
                navigate('/admin');
            } else {
                navigate('/client');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="login-container">
            <AntigravityParticles />
            
            <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
                <img src="/logo/Logo_Rocket_Designers.png" alt="Rocket Designers Logo" className="floating-logo" style={{ maxWidth: '90px', marginBottom: '24px', filter: 'drop-shadow(0 0 10px rgba(249,115,22,0.4))' }} />
                
                <h1 className="login-title">HelpDesk</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem' }}>Bienvenido a Rocket Designers</p>
                
                {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '14px', fontWeight: '500', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuario</label>
                        <input 
                            type="text" 
                            placeholder="Ingresa tu usuario" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                        />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contraseña</label>
                        <input 
                            type="password" 
                            placeholder="Ingresa tu contraseña" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: '16px', padding: '16px 24px', fontSize: '1rem', width: '100%' }}>
                        INGRESAR AL SISTEMA
                    </button>
                </form>
            </div>
        </div>
    );
}

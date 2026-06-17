import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { fetchWithAuth, API_URL } from '../api/api';
import { useNavigate } from 'react-router-dom';
import { LogOut, PlusCircle, MessageSquare, Paperclip } from 'lucide-react';

export default function ClientDashboard() {
    const { user, logout } = useContext(AuthContext);
    const [tickets, setTickets] = useState([]);
    const [projects, setProjects] = useState([]);
    const [view, setView] = useState('list'); // 'list' or 'create'
    const navigate = useNavigate();

    // Create ticket form state
    const [projectId, setProjectId] = useState('');
    const [type, setType] = useState('Duda general');
    const [priority, setPriority] = useState('Media');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);

    useEffect(() => {
        loadTickets();
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const data = await fetchWithAuth('/projects');
            setProjects(data);
        } catch (error) {
            console.error("Error loading projects", error);
        }
    };

    const loadTickets = async () => {
        try {
            const data = await fetchWithAuth('/tickets');
            setTickets(data);
        } catch (error) {
            console.error("Error loading tickets", error);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if (!projectId) {
            alert('Por favor, selecciona un proyecto.');
            return;
        }

        let uploadedUrl = '';
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const uploadRes = await fetch(`${API_URL}/tickets/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                    body: formData
                });
                if (!uploadRes.ok) throw new Error('Failed to upload file');
                const uploadData = await uploadRes.json();
                uploadedUrl = uploadData.url;
            } catch (err) {
                alert('Error subiendo el archivo. Asegúrate que pesa menos de 3MB.');
                return;
            }
        }

        try {
            await fetchWithAuth('/tickets', {
                method: 'POST',
                body: JSON.stringify({
                    project_id: projectId,
                    type,
                    priority,
                    title,
                    description,
                    attachment_url: uploadedUrl
                })
            });
            setView('list');
            loadTickets();
            // Reset form
            setTitle('');
            setDescription('');
            setProjectId('');
            setFile(null);
        } catch (error) {
            alert('Error creando ticket');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-container">
            <div className="sidebar">
                <h3>Portal de Cliente</h3>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                        className={`sidebar-item ${view === 'list' ? 'active' : ''}`} 
                        onClick={() => setView('list')}
                    >
                        <MessageSquare size={20} /> Mis Tickets
                    </button>
                    <button 
                        className={`sidebar-item ${view === 'create' ? 'active' : ''}`} 
                        onClick={() => setView('create')}
                    >
                        <PlusCircle size={20} /> Nuevo Ticket
                    </button>
                </div>
                <div>
                    <div className="sidebar-profile">
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Conectado como</div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{user?.name}</div>
                    </div>
                    <button className="sidebar-item" style={{ justifyContent: 'center', color: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }} onClick={handleLogout}>
                        <LogOut size={20} /> Salir
                    </button>
                </div>
            </div>

            <div className="main-content">
                {view === 'list' && (
                    <div>
                        <h2 style={{ marginBottom: '24px' }}>Mis Tickets</h2>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {tickets.length === 0 ? (
                                <div className="glass-panel" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No tienes tickets activos.
                                </div>
                            ) : (
                                tickets.map(ticket => (
                                    <div key={ticket.id} className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/ticket/${ticket.id}`)}>
                                        <div>
                                            <h4 style={{ marginBottom: '4px' }}>#{ticket.id} - {ticket.title}</h4>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                Proyecto: {ticket.project_name} | Actualizado: {new Date(ticket.updated_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <span className={`badge ${ticket.slaColor}`}>{ticket.status}</span>
                                            <button 
                                                className="btn-outline" 
                                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', fontSize: '0.85rem', borderRadius: '4px' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/ticket/${ticket.id}`);
                                                }}
                                            >
                                                <MessageSquare size={16} /> Ver Detalles
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {view === 'create' && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2>Crear Nuevo Ticket</h2>
                        </div>
                        <div className="glass-panel" style={{ maxWidth: '700px', margin: '0 auto', padding: '32px' }}>
                            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Proyecto Asignado <span style={{color: 'var(--danger)'}}>*</span></label>
                                        <select 
                                            value={projectId} 
                                            onChange={e => setProjectId(e.target.value)} 
                                            required 
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="" disabled style={{ color: '#000' }}>Selecciona tu proyecto...</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id} style={{ color: '#000' }}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tipo de Solicitud <span style={{color: 'var(--danger)'}}>*</span></label>
                                        <select 
                                            value={type} 
                                            onChange={e => setType(e.target.value)}
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                                        >
                                            <option style={{ color: '#000' }}>Duda general</option>
                                            <option style={{ color: '#000' }}>Solicitud de cambio</option>
                                            <option style={{ color: '#000' }}>Mejora</option>
                                            <option style={{ color: '#000' }}>Reporte de Bug</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Prioridad <span style={{color: 'var(--danger)'}}>*</span></label>
                                    <select 
                                        value={priority} 
                                        onChange={e => setPriority(e.target.value)}
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                                    >
                                        <option style={{ color: '#000' }}>Media</option>
                                        <option style={{ color: '#000' }}>Baja</option>
                                        <option style={{ color: '#000' }}>Alta</option>
                                        <option style={{ color: '#000' }}>Urgente</option>
                                    </select>
                                </div>

                                <hr style={{ border: '0', borderTop: '1px solid var(--glass-border)', margin: '8px 0' }} />

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Título Breve <span style={{color: 'var(--danger)'}}>*</span></label>
                                    <input 
                                        type="text" 
                                        value={title} 
                                        onChange={e => setTitle(e.target.value)} 
                                        required 
                                        placeholder="Ej: Cambio en logo de la web"
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none' }}
                                    />
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Descripción Detallada <span style={{color: 'var(--danger)'}}>*</span></label>
                                    <textarea 
                                        rows={6} 
                                        value={description} 
                                        onChange={e => setDescription(e.target.value)} 
                                        required
                                        placeholder="Por favor, describe exactamente qué necesitas..."
                                        style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                                    ></textarea>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Archivo Adjunto (Opcional, Max 3MB)</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                            <Paperclip size={16} /> {file ? 'Cambiar archivo' : 'Seleccionar archivo'}
                                            <input 
                                                type="file" 
                                                onChange={e => setFile(e.target.files[0])} 
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                        {file && <span style={{ fontSize: '0.85rem', color: 'var(--success)' }}>{file.name}</span>}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                    <button type="submit" className="btn-primary" style={{ padding: '0 32px', height: '48px', fontSize: '1rem', fontWeight: '600' }}>
                                        Enviar Solicitud
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

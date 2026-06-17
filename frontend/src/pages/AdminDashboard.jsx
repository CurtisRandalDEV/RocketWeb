import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { fetchWithAuth } from '../api/api';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, FolderKanban, Columns, UserPlus, Key, FolderPlus, Briefcase, CheckCircle, AlertCircle, Clock, AlertTriangle, Activity } from 'lucide-react';

export default function AdminDashboard() {
    const { user, logout } = useContext(AuthContext);
    const [view, setView] = useState('kanban'); // metrics, clients, projects, kanban
    const [metrics, setMetrics] = useState(null);
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [logs, setLogs] = useState([]);
    const [modal, setModal] = useState({ isOpen: false, type: 'success', title: '', content: null });
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectNotes, setProjectNotes] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (view === 'metrics') loadMetrics();
        if (view === 'clients') loadClients();
        if (view === 'projects') loadProjects();
        if (view === 'kanban') loadTickets();
        if (view === 'logs') loadLogs();
    }, [view]);

    const loadLogs = async () => {
        try {
            const data = await fetchWithAuth('/admin/logs');
            setLogs(data);
        } catch (error) {
            console.error(error);
        }
    };

    const loadMetrics = async () => {
        const data = await fetchWithAuth('/admin/metrics');
        setMetrics(data);
    };

    const loadClients = async () => {
        const data = await fetchWithAuth('/admin/clients');
        setClients(data);
    };

    const loadProjects = async () => {
        const data = await fetchWithAuth('/admin/projects');
        setProjects(data);
    };

    const loadTickets = async () => {
        const data = await fetchWithAuth('/tickets');
        setTickets(data);
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const email = e.target.email.value;
        const company = e.target.company.value;
        const rawPhone = e.target.phone.value;
        const countryCode = e.target.country_code.value;
        const phone = countryCode + rawPhone.replace(/\D/g, '');

        try {
            const res = await fetchWithAuth('/admin/clients', {
                method: 'POST',
                body: JSON.stringify({ name, email, company, phone })
            });
            setModal({
                isOpen: true,
                type: 'success',
                title: 'Cliente Creado',
                content: (
                    <div>
                        <p style={{ marginBottom: '16px' }}>El cliente <strong>{name}</strong> se ha registrado correctamente.</p>
                        <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Usuario:</span>
                                <strong style={{ color: 'var(--accent-color)' }}>{res.credentials.username}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Contraseña:</span>
                                <strong style={{ color: 'var(--accent-color)' }}>{res.credentials.key}</strong>
                            </div>
                        </div>
                        <p style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--warning)' }}>⚠️ Guarda esta contraseña, no se mostrará de nuevo.</p>
                    </div>
                )
            });
            loadClients();
            e.target.reset();
        } catch (error) {
            setModal({ isOpen: true, type: 'error', title: 'Error', content: 'No se pudo registrar el cliente.' });
        }
    };

    const handleRegenerateKey = async (id) => {
        if (!confirm('¿Regenerar clave?')) return;
        try {
            const res = await fetchWithAuth(`/admin/clients/${id}/regenerate-key`, { method: 'POST' });
            setModal({
                isOpen: true,
                type: 'success',
                title: 'Clave Regenerada',
                content: (
                    <div>
                        <p style={{ marginBottom: '16px' }}>La contraseña ha sido actualizada.</p>
                        <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Nueva Contraseña:</span>
                                <strong style={{ color: 'var(--accent-color)' }}>{res.newKey}</strong>
                            </div>
                        </div>
                    </div>
                )
            });
        } catch (error) {
            setModal({ isOpen: true, type: 'error', title: 'Error', content: 'No se pudo regenerar la clave.' });
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const description = e.target.description.value;
        const client_id = e.target.client_id.value;

        try {
            await fetchWithAuth('/admin/projects', {
                method: 'POST',
                body: JSON.stringify({ name, description, client_id })
            });
            setModal({ isOpen: true, type: 'success', title: 'Proyecto Creado', content: 'El proyecto se ha registrado exitosamente.' });
            loadProjects();
            e.target.reset();
        } catch (error) {
            setModal({ isOpen: true, type: 'error', title: 'Error', content: 'No se pudo crear el proyecto.' });
        }
    };

    const handleSaveNotes = async () => {
        try {
            await fetchWithAuth(`/admin/projects/${selectedProject.id}/notes`, {
                method: 'PUT',
                body: JSON.stringify({ notes: projectNotes })
            });
            setModal({ isOpen: true, type: 'success', title: 'Notas Guardadas', content: 'Las notas del proyecto se han guardado exitosamente.' });
            
            // Update local state so when going back it shows updated note if clicked again
            setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, notes: projectNotes } : p));
            
        } catch (error) {
            setModal({ isOpen: true, type: 'error', title: 'Error', content: 'No se pudieron guardar las notas.' });
        }
    };

    const renderLogDetails = (details) => {
        const match = details.match(/ticket #(\d+)/i);
        if (match) {
            const parts = details.split(match[0]);
            return (
                <>
                    {parts[0]}
                    <span 
                        onClick={() => navigate(`/ticket/${match[1]}`)} 
                        style={{ color: 'var(--accent-color)', cursor: 'pointer', textDecoration: 'underline', fontWeight: '500' }}
                    >
                        {match[0]}
                    </span>
                    {parts[1]}
                </>
            );
        }
        return details;
    };

    return (
        <div className="app-container">
            <div className="sidebar">
                <h3>Admin Portal</h3>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button className={`sidebar-item ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>
                        <Columns size={20} /> Tablero Kanban
                    </button>
                    <button className={`sidebar-item ${view === 'metrics' ? 'active' : ''}`} onClick={() => setView('metrics')}>
                        <LayoutDashboard size={20} /> Métricas
                    </button>
                    <button className={`sidebar-item ${view === 'clients' ? 'active' : ''}`} onClick={() => setView('clients')}>
                        <Users size={20} /> Clientes
                    </button>
                    <button className={`sidebar-item ${view === 'projects' ? 'active' : ''}`} onClick={() => setView('projects')}>
                        <FolderKanban size={20} /> Proyectos
                    </button>
                    { (user?.role === 'ceo' || user?.role === 'admin') && (
                        <button className={`sidebar-item ${view === 'logs' ? 'active' : ''}`} onClick={() => setView('logs')}>
                            <Activity size={20} /> Log de Actividad
                        </button>
                    )}
                </div>
                <div>
                    <div className="sidebar-profile">
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            { (user?.role === 'ceo' || user?.role === 'admin') ? 'CEO' : 'Developer'}
                        </div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{user?.name || user?.username}</div>
                    </div>
                    <button className="sidebar-item" style={{ justifyContent: 'center', color: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }} onClick={() => { logout(); navigate('/login'); }}>
                        <LogOut size={20} /> Salir
                    </button>
                </div>
            </div>

            <div className="main-content">
                {view === 'metrics' && metrics && (
                    <div>
                        <h2 style={{ marginBottom: '24px' }}>Métricas Generales</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                            <div className="glass-panel" style={{ textAlign: 'center' }}>
                                <h3>Total Clientes</h3>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{metrics.general.total_clients}</div>
                            </div>
                            <div className="glass-panel" style={{ textAlign: 'center' }}>
                                <h3>Total Tickets</h3>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{metrics.general.total_tickets}</div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'clients' && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2>Gestión de Clientes</h2>
                        </div>
                        
                        {(user?.role === 'ceo' || user?.role === 'admin') && (
                            <div className="glass-panel" style={{ marginBottom: '32px', borderLeft: '4px solid var(--accent-color)' }}>
                                <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <UserPlus size={18} color="var(--accent-color)" /> Alta de Nuevo Cliente
                                </h4>
                                <form onSubmit={handleCreateClient} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '20px', alignItems: 'end' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nombre del Contacto <span style={{color: 'var(--danger)'}}>*</span></label>
                                        <input type="text" name="name" required placeholder="Ej: Juan Pérez" style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Correo Electrónico <span style={{color: 'var(--danger)'}}>*</span></label>
                                        <input type="email" name="email" required placeholder="Ej: juan@empresa.com" style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Empresa / Marca <span style={{color: 'var(--danger)'}}>*</span></label>
                                        <input type="text" name="company" required placeholder="Ej: Rocket Designers" style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>WhatsApp / Teléfono <span style={{color: 'var(--danger)'}}>*</span></label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <select name="country_code" style={{ width: '80px', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none', appearance: 'none', textAlign: 'center' }}>
                                                <option value="52" style={{color: '#000'}}>+52</option>
                                                <option value="34" style={{color: '#000'}}>+34</option>
                                                <option value="1" style={{color: '#000'}}>+1</option>
                                                <option value="57" style={{color: '#000'}}>+57</option>
                                                <option value="54" style={{color: '#000'}}>+54</option>
                                                <option value="56" style={{color: '#000'}}>+56</option>
                                                <option value="51" style={{color: '#000'}}>+51</option>
                                            </select>
                                            <input type="text" name="phone" required placeholder="Ej: 55 1234 5678" style={{ flex: 1, padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none' }} />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ height: '42px', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <UserPlus size={16} /> Registrar
                                    </button>
                                </form>
                            </div>
                        )}
                        
                        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Users size={18} color="var(--accent-color)" /> Directorio de Clientes
                                </h4>
                            </div>
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Usuario (ID)</th>
                                        <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Contacto</th>
                                        <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Empresa</th>
                                        <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'right' }}>Seguridad</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.map(c => (
                                        <tr key={c.id} style={{ transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                                                <div style={{ fontWeight: '600', color: 'var(--accent-color)' }}>{c.username}</div>
                                            </td>
                                            <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                                        {c.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div>{c.name}</div>
                                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{c.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)' }}>{c.company}</td>
                                            <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', textAlign: 'right' }}>
                                                {(user?.role === 'ceo' || user?.role === 'admin') && (
                                                    <button className="btn-outline" onClick={() => handleRegenerateKey(c.id)} style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                        <Key size={14} /> Regenerar Key
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {clients.length === 0 && (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                No hay clientes registrados aún.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {view === 'kanban' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <h2>Bandeja de Tickets</h2>
                        <div className="kanban-board">
                            {['Nuevo', 'En Revisión', 'En Desarrollo', 'Esperando al Cliente', 'Completado'].map(status => {
                                const columnTickets = tickets.filter(t => t.status === status);
                                return (
                                    <div key={status} className="kanban-column">
                                        <div className="kanban-column-header">
                                            {status}
                                            <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                                                {columnTickets.length}
                                            </span>
                                        </div>
                                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                                            {columnTickets.map(ticket => (
                                                <div key={ticket.id} className="kanban-card" onClick={() => navigate(`/ticket/${ticket.id}`)} style={{ padding: '16px', borderLeft: `4px solid ${ticket.priority === 'Urgente' ? 'var(--danger)' : ticket.priority === 'Alta' ? 'var(--warning)' : ticket.priority === 'Media' ? '#3b82f6' : 'var(--text-secondary)'}`, position: 'relative' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.5px' }}>#{ticket.id}</span>
                                                        <span className={`badge ${ticket.slaColor}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Clock size={12} /> {ticket.days_open}d
                                                        </span>
                                                    </div>
                                                    <div style={{ fontWeight: '600', marginBottom: '16px', lineHeight: '1.4', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{ticket.title}</div>
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(249,115,22,0.1)', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                                {ticket.client_name.charAt(0)}
                                                            </div>
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ticket.client_name}</span>
                                                        </div>
                                                        <span style={{ fontSize: '0.75rem', color: ticket.priority === 'Urgente' ? 'var(--danger)' : ticket.priority === 'Alta' ? 'var(--warning)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '4px' }}>
                                                            {ticket.priority === 'Urgente' || ticket.priority === 'Alta' ? <AlertTriangle size={12} /> : null}
                                                            {ticket.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {view === 'projects' && !selectedProject && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2>Gestión de Proyectos</h2>
                        </div>
                        
                        {(user?.role === 'ceo' || user?.role === 'admin') && (
                            <div className="glass-panel" style={{ marginBottom: '32px', borderLeft: '4px solid var(--accent-color)' }}>
                                <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FolderPlus size={18} color="var(--accent-color)" /> Crear Nuevo Proyecto
                                </h4>
                                <form onSubmit={handleCreateProject} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '20px', alignItems: 'end' }}>
                                    <div>
                                        <label style={{display:'block', marginBottom:'8px', fontSize:'0.85rem', color:'var(--text-secondary)'}}>Nombre del Proyecto</label>
                                        <input name="name" required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none' }} placeholder="Ej. Rediseño Web" />
                                    </div>
                                    <div>
                                        <label style={{display:'block', marginBottom:'8px', fontSize:'0.85rem', color:'var(--text-secondary)'}}>Cliente Asignado</label>
                                        <select name="client_id" required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none' }}>
                                            <option value="" style={{ color: '#000' }}>Selecciona un cliente...</option>
                                            {clients.map(c => <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.name} ({c.company})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{display:'block', marginBottom:'8px', fontSize:'0.85rem', color:'var(--text-secondary)'}}>Descripción Breve</label>
                                        <input name="description" required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none' }} placeholder="Ej. Landing page y embudo" />
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ height: '42px', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FolderPlus size={16} /> Crear
                                    </button>
                                </form>
                            </div>
                        )}
                        
                        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Briefcase size={18} color="var(--accent-color)" /> Proyectos Activos
                                </h4>
                            </div>
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Proyecto</th>
                                        <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Cliente</th>
                                        <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Descripción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map(p => (
                                        <tr key={p.id} onClick={() => { setSelectedProject(p); setProjectNotes(p.notes || ''); }} style={{ transition: 'background-color 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', fontWeight: '600', color: 'var(--text-primary)' }}>
                                                {p.name}
                                            </td>
                                            <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(249,115,22,0.1)', color: 'var(--accent-color)', padding: '4px 10px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '600' }}>
                                                    <Users size={12} /> {p.client_name}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                {p.description}
                                            </td>
                                        </tr>
                                    ))}
                                    {projects.length === 0 && (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                No hay proyectos creados aún.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {view === 'projects' && selectedProject && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <button className="btn-outline" onClick={() => setSelectedProject(null)} style={{ padding: '8px 16px' }}>Volver</button>
                            <h2 style={{ margin: 0 }}>Proyecto: {selectedProject.name}</h2>
                            <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(249,115,22,0.1)', color: 'var(--accent-color)', padding: '4px 12px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: '600' }}>
                                Cliente: {selectedProject.client_name}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
                            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FolderKanban size={20} color="var(--accent-color)" /> Tickets Abiertos
                                </h3>
                                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
                                    {tickets.filter(t => t.project_id === selectedProject.id && t.status !== 'Completado').length === 0 ? (
                                        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '24px' }}>No hay tickets abiertos.</div>
                                    ) : (
                                        tickets.filter(t => t.project_id === selectedProject.id && t.status !== 'Completado').map(t => (
                                            <div key={t.id} onClick={() => navigate(`/ticket/${t.id}`)} style={{ padding: '16px', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.02)', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <strong style={{ color: 'var(--text-primary)' }}>{t.title}</strong>
                                                    <span className={`badge ${t.slaColor}`}>{t.status}</span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Prioridad: {t.priority}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Briefcase size={20} color="var(--accent-color)" /> Notas del Admin
                                </h3>
                                <textarea 
                                    value={projectNotes}
                                    onChange={(e) => setProjectNotes(e.target.value)}
                                    placeholder="Escribe notas internas sobre el proyecto aquí. El cliente no las verá."
                                    style={{ flex: 1, width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none', resize: 'none', fontFamily: 'inherit', marginBottom: '16px' }}
                                />
                                <div style={{ textAlign: 'right' }}>
                                    <button className="btn-primary" onClick={handleSaveNotes}>Guardar Notas</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {view === 'logs' && (user?.role === 'ceo' || user?.role === 'admin') && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <h2 style={{ marginBottom: '24px' }}>Log de Actividad</h2>
                        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Fecha/Hora</th>
                                        <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Usuario</th>
                                        <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Acción</th>
                                        <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Detalles</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id} style={{ transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </td>
                                            <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: '600', color: log.user_role === 'ceo' ? 'var(--accent-color)' : 'var(--text-primary)' }}>{log.user_name}</span>
                                                    <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>{log.user_role}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                                                <span className={`badge ${log.action === 'login' ? 'gray' : 'green'}`}>{log.action}</span>
                                            </td>
                                            <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)' }}>{renderLogDetails(log.details)}</td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                No hay actividad registrada aún.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {modal.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="glass-panel" style={{ width: '420px', maxWidth: '90%', animation: 'fadeIn 0.2s ease-out', borderTop: `4px solid ${modal.type === 'error' ? 'var(--danger)' : 'var(--success)'}` }}>
                        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: modal.type === 'error' ? 'var(--danger)' : 'var(--success)' }}>
                            {modal.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
                            {modal.title}
                        </h3>
                        <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            {modal.content}
                        </div>
                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn-primary" onClick={() => setModal({ isOpen: false, type: 'success', title: '', content: null })}>
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

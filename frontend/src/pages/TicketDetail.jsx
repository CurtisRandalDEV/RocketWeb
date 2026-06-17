import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchWithAuth } from '../api/api';
import { ArrowLeft, Send, Clock, User, Briefcase, Activity, Tag, Hash, Calendar, MessageSquare, AlertCircle, Paperclip, Lock } from 'lucide-react';

export default function TicketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [file, setFile] = useState(null);
    const [isInternal, setIsInternal] = useState(false);
    const chatEndRef = useRef(null);
    const prevMessagesLength = useRef(0);

    useEffect(() => {
        loadTicket();
        loadMessages();
        const interval = setInterval(loadMessages, 5000); // Simple polling for chat
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        if (messages.length > prevMessagesLength.current) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        prevMessagesLength.current = messages.length;
    }, [messages]);

    const loadTicket = async () => {
        try {
            const data = await fetchWithAuth(`/tickets/${id}`);
            setTicket(data);
        } catch (error) {
            navigate(-1);
        }
    };

    const loadMessages = async () => {
        try {
            const data = await fetchWithAuth(`/tickets/${id}/messages`);
            setMessages(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleStatusChange = async (e) => {
        const status = e.target.value;
        try {
            await fetchWithAuth(`/tickets/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
            loadTicket();
            loadMessages();
        } catch (error) {
            alert('Error updating status');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !file) return;

        let uploadedUrl = '';
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const uploadRes = await fetch('http://localhost:5000/api/tickets/upload', {
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
            await fetchWithAuth(`/tickets/${id}/messages`, {
                method: 'POST',
                body: JSON.stringify({ content: newMessage, is_internal: isInternal, attachment_url: uploadedUrl })
            });
            setNewMessage('');
            setFile(null);
            setIsInternal(false);
            loadMessages();
        } catch (error) {
            alert('Error enviando mensaje');
        }
    };

    if (!ticket) return <div style={{ padding: '32px', textAlign: 'center' }}>Cargando...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px' }}>
            <button className="btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={16} /> Volver
            </button>
            
            <div className="ticket-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-panel" style={{ padding: '32px' }}>
                        <div className="ticket-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Hash size={14} /> {ticket.id}
                                    </span>
                                    {user?.role !== 'admin' && (
                                        <span className={`badge gray`} style={{ fontSize: '0.85rem' }}>{ticket.status}</span>
                                    )}
                                </div>
                                <h2 style={{ margin: 0, fontSize: '1.8rem', lineHeight: '1.3' }}>{ticket.title}</h2>
                            </div>
                            
                            {(user?.role === 'ceo' || user?.role === 'admin' || user?.role === 'developer') && (
                                <div className="ticket-header-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>ESTADO DEL TICKET</label>
                                    <select 
                                        value={ticket.status} 
                                        onChange={handleStatusChange} 
                                        style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontWeight: '600' }}
                                    >
                                        <option style={{ color: '#000' }}>Nuevo</option>
                                        <option style={{ color: '#000' }}>En Revisión</option>
                                        <option style={{ color: '#000' }}>En Desarrollo</option>
                                        <option style={{ color: '#000' }}>Esperando al Cliente</option>
                                        <option style={{ color: '#000' }}>Completado</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        
                        <div className="ticket-info-flex" style={{ display: 'flex', gap: '24px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Briefcase size={14} /> Proyecto
                                </div>
                                <div style={{ fontWeight: '600' }}>{ticket.project_name}</div>
                            </div>
                            <div className="ticket-info-divider" style={{ width: '1px', backgroundColor: 'var(--glass-border)' }}></div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Tag size={14} /> Tipo
                                </div>
                                <div style={{ fontWeight: '600' }}>{ticket.type}</div>
                            </div>
                            <div className="ticket-info-divider" style={{ width: '1px', backgroundColor: 'var(--glass-border)' }}></div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <AlertCircle size={14} /> Prioridad
                                </div>
                                <div style={{ fontWeight: '600', color: ticket.priority === 'Urgente' ? 'var(--danger)' : ticket.priority === 'Alta' ? 'var(--warning)' : 'inherit' }}>{ticket.priority}</div>
                            </div>
                        </div>

                        <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {ticket.description}
                            {ticket.attachment_url && (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                                    <a href={ticket.attachment_url.startsWith('http') ? ticket.attachment_url : `http://localhost:5000${ticket.attachment_url}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--accent-color)', fontWeight: '500', fontSize: '0.9rem' }}>
                                        <Paperclip size={16} /> Ver Archivo Adjunto
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MessageSquare size={18} color="var(--accent-color)" /> Chat y Bitácora
                            </h3>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {messages.map(msg => (
                                <div key={msg.id} style={{ 
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignSelf: msg.type === 'system_log' ? 'center' : (msg.sender_id === user.id ? 'flex-end' : 'flex-start'),
                                    maxWidth: msg.type === 'system_log' ? '90%' : '80%'
                                }}>
                                    {msg.type !== 'system_log' && (
                                        <div style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', alignSelf: msg.sender_id === user.id ? 'flex-end' : 'flex-start' }}>
                                            {msg.is_internal && <Lock size={12} color="var(--warning)" />}
                                            <span style={{ fontWeight: '600', color: (msg.sender_role === 'ceo' || msg.sender_role === 'admin' || msg.sender_role === 'developer') ? 'var(--accent-color)' : 'var(--text-primary)' }}>
                                                {msg.sender_name} {(msg.sender_role === 'ceo' || msg.sender_role === 'admin') ? '(CEO)' : msg.sender_role === 'developer' ? '(Developer)' : ''}
                                            </span>
                                            <span style={{ opacity: 0.5 }}>• {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    )}
                                    <div style={{ 
                                        padding: msg.type === 'system_log' ? '8px 16px' : '14px 18px', 
                                        borderRadius: msg.type === 'system_log' ? '100px' : (msg.sender_id === user.id ? '18px 18px 4px 18px' : '18px 18px 18px 4px'),
                                        backgroundColor: msg.type === 'system_log' ? 'rgba(255,255,255,0.03)' : msg.is_internal ? 'rgba(245, 158, 11, 0.15)' : (msg.sender_id === user.id ? 'var(--accent-color)' : 'var(--navy-soft)'),
                                        fontSize: msg.type === 'system_log' ? '0.8rem' : '0.95rem',
                                        color: msg.type === 'system_log' ? 'var(--text-secondary)' : msg.is_internal ? 'var(--warning)' : 'white',
                                        border: msg.type === 'system_log' ? '1px solid var(--glass-border)' : msg.is_internal ? '1px solid rgba(245, 158, 11, 0.3)' : 'none',
                                        boxShadow: msg.type !== 'system_log' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                                        lineHeight: '1.5'
                                    }}>
                                        {msg.content}
                                        {msg.attachment_url && (
                                            <div style={{ marginTop: '10px' }}>
                                                <a href={msg.attachment_url.startsWith('http') ? msg.attachment_url : `http://localhost:5000${msg.attachment_url}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'inherit', textDecoration: 'underline', opacity: 0.9 }}>
                                                    <Paperclip size={14} /> Archivo Adjunto
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        
                        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {user?.role !== 'client' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', color: isInternal ? 'var(--warning)' : 'var(--text-secondary)' }}>
                                            <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                                            <Lock size={14} /> Nota Interna (Visible solo para el equipo)
                                        </label>
                                    </div>
                                )}
                                {file && <div style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}><Paperclip size={12} /> Adjunto: {file.name}</div>}
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
                                        <Paperclip size={18} />
                                        <input type="file" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
                                    </label>
                                    <input 
                                        type="text" 
                                        value={newMessage} 
                                        onChange={e => setNewMessage(e.target.value)} 
                                        placeholder={isInternal ? "Escribe una nota interna..." : "Escribe tu mensaje aquí..."} 
                                        style={{ flex: 1, padding: '0 20px', borderRadius: '100px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
                                    />
                                    <button type="submit" className="btn-primary" style={{ padding: '0 24px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Send size={16} /> Enviar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                                <User size={18} color="var(--accent-color)" /> Información del Cliente
                            </h3>
                        </div>
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Nombre</div>
                                <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(249,115,22,0.1)', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                                        {ticket.client_name.charAt(0)}
                                    </div>
                                    {ticket.client_name}
                                </div>
                            </div>
                            <hr style={{ border: 0, borderTop: '1px solid var(--glass-border)', margin: 0 }} />
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={14} /> Fecha de Creación
                                </div>
                                <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{new Date(ticket.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Activity size={14} /> Última Actividad
                                </div>
                                <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{new Date(ticket.updated_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

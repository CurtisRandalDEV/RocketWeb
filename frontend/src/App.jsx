import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import TicketDetail from './pages/TicketDetail';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>Cargando...</div>;

    if (!user) return <Navigate to="/login" />;

    if (allowedRole) {
        if (Array.isArray(allowedRole)) {
            if (!allowedRole.includes(user.role) && !allowedRole.includes('admin')) {
                return <Navigate to={user.role === 'client' ? '/client' : '/admin'} />;
            }
        } else if (user.role !== allowedRole && !(allowedRole === 'admin' && (user.role === 'ceo' || user.role === 'developer'))) {
            return <Navigate to={user.role === 'client' ? '/client' : '/admin'} />;
        }
    }

    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
                path="/admin" 
                element={
                    <ProtectedRoute allowedRole="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                } 
            />
            
            <Route 
                path="/client" 
                element={
                    <ProtectedRoute allowedRole="client">
                        <ClientDashboard />
                    </ProtectedRoute>
                } 
            />

            <Route 
                path="/ticket/:id" 
                element={
                    <ProtectedRoute>
                        <TicketDetail />
                    </ProtectedRoute>
                } 
            />

            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
}

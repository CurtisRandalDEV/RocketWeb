const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Autenticación requerida.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_rocket');
        req.user = decoded; // { id, role, username }
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
};

const ceoMiddleware = (req, res, next) => {
    if (req.user && (req.user.role === 'ceo' || req.user.role === 'admin')) {
        next();
    } else {
        return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de CEO.' });
    }
};

const staffMiddleware = (req, res, next) => {
    if (req.user && (req.user.role === 'ceo' || req.user.role === 'admin' || req.user.role === 'developer')) {
        next();
    } else {
        return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de Staff.' });
    }
};

module.exports = { authMiddleware, ceoMiddleware, staffMiddleware };

// middleware/auth.middleware.js
const jwt = require('jsonwebtoken'); // Todavía necesitas jwt para los tipos de error
const User = require('../models/User'); 
const { verifyAccessToken } = require('../config/jwt'); // <-- Importa la función específica

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // AHORA LLAMAMOS A verifyAccessToken que lanzará un error si falla
            const decoded = verifyAccessToken(token); 

            req.user = await User.findById(decoded.userId).select('-password -refreshTokens'); 

            if (!req.user) {
                return res.status(401).json({ message: 'Usuario asociado al token no encontrado.' });
            }

            next();

        } catch (error) {
            // Manejo de errores específicos de JWT lanzados por verifyAccessToken
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token de acceso expirado. Por favor, inicie sesión de nuevo o use el refresh token.' });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Token de acceso inválido.' });
            }
            console.error('Error en el middleware de autenticación:', error);
            return res.status(500).json({ message: 'Error interno del servidor al procesar la autenticación.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'No autorizado, no se encontró token de acceso.' });
    }
};

module.exports = { protect };
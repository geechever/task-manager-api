// src/config/jwt.js
const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');
const { v4: uuidv4 } = require('uuid'); // Importa uuid para generar identificadores únicos

// ¡Necesitas instalar uuid si aún no lo has hecho!
// npm install uuid

// Función auxiliar para generar tokens
const generateToken = (payload, expiresIn, secret) => {
    return jwt.sign(payload, secret, { expiresIn });
};

// Función para verificar tokens: ¡DEBE LANZAR EL ERROR!
const verifyToken = (token, secret) => {
    return jwt.verify(token, secret);
};

module.exports = {
    generateAccessToken: (userId, role) => generateToken({ userId, role }, process.env.JWT_EXPIRES_IN, process.env.JWT_SECRET),
    // Modifica generateRefreshToken para incluir un ID único (jti)
    generateRefreshToken: (userId) => {
        // Añadimos 'jti' (JWT ID) para asegurar la unicidad en el token.
        // Esto ayuda a que cada refresh token sea distinto incluso si se generan muy rápido.
        const jti = uuidv4();
        return generateToken({ userId, jti }, process.env.JWT_REFRESH_EXPIRES_IN, process.env.JWT_REFRESH_SECRET);
    },

    // Funciones específicas para verificar Access y Refresh Tokens con sus secretos
    verifyAccessToken: (token) => verifyToken(token, process.env.JWT_SECRET),
    verifyRefreshToken: (token) => verifyToken(token, process.env.JWT_REFRESH_SECRET)
};
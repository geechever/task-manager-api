// src/controllers/auth.controller.js
const User = require('../models/User');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
} = require('../config/jwt');
const logger = require('../../utils/logger'); // <-- RUTA ACTUALIZADA: Dos niveles arriba para llegar a /utils

// REGISTRO DE USUARIO
const register = async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;

        // 1. Verificar si el usuario ya existe
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            // Aseguramos que se envía un JSON en caso de error de registro
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // 2. Crear nuevo usuario. La contraseña se hashea en el pre-save hook del modelo.
        const user = new User({ username, email, password, role: role || 'user' });
        await user.save();

        // 3. Generar tokens (Access Token y Refresh Token)
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        // 4. Guardar el refreshToken en el ARRAY de refreshTokens del usuario
        // Asegúrate de usar .select('+refreshTokens') si el usuario no fue cargado con ellos
        const updatedUser = await User.findById(user._id).select('+refreshTokens');
        if (updatedUser) {
            updatedUser.refreshTokens.push(refreshToken);
            await updatedUser.save();
        } else {
            logger.warn(`Register: Usuario ${user._id} no encontrado después del save para añadir refresh token.`);
            // Manejar este caso si el usuario no se encuentra inmediatamente después de crear
        }

        // 5. Enviar respuesta al cliente
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            accessToken,
            refreshToken
        });
    } catch (err) {
        logger.error('Registration Error:', err);
        next(err);
    }
};

// INICIO DE SESIÓN
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Buscar al usuario y seleccionar la contraseña y los refreshTokens
        const user = await User.findOne({ email }).select('+password +refreshTokens');
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // 2. Validar la contraseña
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // 3. Generar nuevos tokens
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        // 4. Añadir el nuevo refresh token al array del usuario
        user.refreshTokens.push(refreshToken);
        await user.save(); // Guarda el usuario con el nuevo refresh token

        // 5. Enviar respuesta al cliente
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            accessToken,
            refreshToken
        });
    } catch (err) {
        logger.error('Login Error:', err);
        next(err);
    }
};

// RENOVACIÓN DE TOKEN
const refresh = async (req, res, next) => {
    const { refreshToken } = req.body;

    logger.debug(`Refresh - Refresh token recibido: ${refreshToken}`); // Debugging
    logger.debug(`Refresh - Usando JWT_REFRESH_SECRET: ${process.env.JWT_REFRESH_SECRET}`); // Debugging crucial

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token es requerido' });
    }

    try {
        // 1. Verificar el refresh token
        const decoded = verifyRefreshToken(refreshToken); // Solo se pasa el token, el secreto ya está en la función
        logger.debug(`Refresh - Token decodificado: ${JSON.stringify(decoded)}`); // Debugging

        // 2. Buscar al usuario correspondiente al refresh token y seleccionar sus refreshTokens
        const user = await User.findById(decoded.userId).select('+refreshTokens');
        if (!user) {
            logger.warn(`Refresh - Usuario ${decoded.userId} no encontrado.`); // Debugging
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }
        logger.debug(`Refresh - Usuario encontrado: ${user.email}, ID: ${user._id}`); // Debugging
        logger.debug(`Refresh - Tokens en DB para el usuario: ${user.refreshTokens}`); // Debugging crucial

        // 3. Verificar si el refresh token *exacto* recibido existe en el ARRAY del usuario
        if (!user.refreshTokens.includes(refreshToken)) {
            logger.warn(`Refresh - Token [${refreshToken}] no encontrado en la DB para el usuario ${user.email}. Revocando todos los tokens.`); // Debugging
            user.refreshTokens = []; // Si un token no esperado se usa, invalida todos para seguridad
            await user.save();
            return res.status(403).json({ message: 'Refresh Token inválido o revocado' });
        }

        // 4. Generar nuevos tokens (Access Token y el nuevo Refresh Token)
        const newAccessToken = generateAccessToken(user._id, user.role);
        const newRefreshToken = generateRefreshToken(user._id);
        logger.debug("Refresh - Tokens generados."); // Debugging

        // 5. Actualizar el refresh token del usuario: Remover el viejo y añadir el nuevo (Rotación de tokens)
        user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
        user.refreshTokens.push(newRefreshToken);
        await user.save(); // Guarda los cambios en la DB
        logger.debug("Refresh - Tokens rotados y guardados en DB."); // Debugging

        // 6. Enviar respuesta al cliente
        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (err) {
        logger.error('Refresh Error (catch block):', err); // Debugging
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Refresh Token expirado. Por favor, inicia sesión de nuevo.' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: 'Refresh Token inválido. Reautenticación requerida.' });
        }
        // Este catch asegura que siempre se envíe un JSON de error si algo inesperado ocurre
        res.status(500).json({ message: 'Error interno del servidor al renovar token.' });
        next(err); // Pasa el error al middleware centralizado si es un tipo diferente
    }
};

// CERRAR SESIÓN
const logout = async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh Token es requerido para cerrar sesión específica.' });
    }

    try {
        // Busca al usuario que tiene este refresh token en su array
        // Asegúrate de seleccionar refreshTokens aquí
        const user = await User.findOne({ refreshTokens: refreshToken }).select('+refreshTokens');

        if (!user) {
            // Si el token ya no está o el usuario no existe, se considera exitoso igualmente
            return res.status(200).json({ message: 'Sesión cerrada exitosamente (token no encontrado o ya revocado).' });
        }

        // Eliminar el refresh token específico del array del usuario
        user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
        await user.save();

        res.status(200).json({ message: 'Sesión cerrada exitosamente.' });

    } catch (err) {
        logger.error('Logout Error:', err);
        next(err);
    }
};

module.exports = {
    register,
    login,
    refreshToken: refresh,
    logout
};
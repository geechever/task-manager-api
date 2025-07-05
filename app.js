// app.js
require('dotenv').config(); // ¡Debe ser la primera línea para cargar las variables de entorno!

// --- START: Debugging lines (REMOVE IN PRODUCTION) ---
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET);
console.log('JWT_REFRESH_SECRET loaded:', process.env.JWT_REFRESH_SECRET);
// --- END: Debugging lines ---

const express = require('express');
const mongoose = require('mongoose');
const logger = require('./utils/logger'); // Ruta correcta: utils está al mismo nivel que app.js
const authRoutes = require('./src/routes/auth.routes'); // <-- RUTA ACTUALIZADA
const taskRoutes = require('./src/routes/task.routes'); // <-- RUTA ACTUALIZADA
const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => logger.info('MongoDB Connected...'))
.catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1); // Sale de la aplicación si no puede conectar a la DB
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Middleware de manejo de errores centralizado
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Error interno del servidor';

    // Manejo específico para errores de JWT
    if (err.name === 'JsonWebTokenError') {
        logger.error('JWT Error:', err.message);
        return res.status(403).json({ message: 'Token inválido o corrupto.' });
    }
    if (err.name === 'TokenExpiredError') {
        logger.warn('JWT Token expirado:', err.message);
        return res.status(401).json({ message: 'Token expirado. Por favor, inicia sesión de nuevo.' });
    }

    res.status(statusCode).json({ message });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
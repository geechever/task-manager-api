// utils/logger.js
const moment = require('moment'); // Asegúrate de haber instalado 'moment' con: npm install moment

const log = (level, message, ...args) => {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    console.log(`[${timestamp}] [${level.toUpperCase()}]: ${message}`, ...args);
};

module.exports = {
    info: (message, ...args) => log('info', message, ...args),
    warn: (message, ...args) => log('warn', message, ...args),
    error: (message, ...args) => log('error', message, ...args),
    debug: (message, ...args) => log('debug', message, ...args)
};
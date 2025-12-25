// utils/dateHelpers.js

/**
 * Normaliza una fecha al inicio del día (00:00:00)
 * @param {Date|string} date - Fecha a normalizar
 * @returns {Date} Fecha normalizada al inicio del día
 */
const startOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Calcula la próxima fecha de vencimiento según la frecuencia de pago
 * @param {Date|string} lastDate - Última fecha de pago o venta
 * @param {string} frequency - Frecuencia: 'SEMANAL', 'QUINCENAL', 'MENSUAL'
 * @returns {Date} Próxima fecha de vencimiento
 */
const getNextDueDate = (lastDate, frequency) => {
    const base = new Date(lastDate);
    
    switch (frequency?.toUpperCase()) {
        case 'SEMANAL':
        case 'WEEKLY':
            base.setDate(base.getDate() + 7);
            break;
        case 'QUINCENAL':
        case 'BIWEEKLY':
            base.setDate(base.getDate() + 15);
            break;
        case 'MENSUAL':
        case 'MONTHLY':
            base.setMonth(base.getMonth() + 1);
            break;
        default:
            // Default: semanal
            base.setDate(base.getDate() + 7);
    }
    
    return base;
};

/**
 * Convierte un valor a número seguro
 * @param {any} value - Valor a convertir
 * @returns {number} Número convertido o 0 si no es válido
 */
const N = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};

/**
 * Calcula los días entre dos fechas
 * @param {Date} date1 - Primera fecha
 * @param {Date} date2 - Segunda fecha
 * @returns {number} Número de días de diferencia
 */
const daysBetween = (date1, date2) => {
    const msPerDay = 24 * 60 * 60 * 1000;
    const d1 = startOfDay(date1);
    const d2 = startOfDay(date2);
    return Math.round((d2.getTime() - d1.getTime()) / msPerDay);
};

/**
 * Formatea una fecha a formato local
 * @param {Date|string} date - Fecha a formatear
 * @param {string} locale - Locale (default: 'es-MX')
 * @returns {string} Fecha formateada
 */
const formatDate = (date, locale = 'es-MX') => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

module.exports = {
    startOfDay,
    getNextDueDate,
    N,
    daysBetween,
    formatDate
};
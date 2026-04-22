require('dotenv').config();
const { setupWhatsApp } = require('./src/core/whatsapp');
const logger = require('./src/utils/logger');

async function startBot() {
    logger.info('🚀 Démarrage de Miyabi Bot v2...');
    logger.info('🧠 Mode: Intentions naturelles via Gemini AI');

    try {
        await setupWhatsApp();
    } catch (error) {
        logger.error('Erreur fatale:', error);
        process.exit(1);
    }
}

startBot();

process.on('uncaughtException', (error) => {
    logger.error('Exception non catchée:', error);
});

process.on('unhandledRejection', (error) => {
    logger.error('Rejection non gérée:', error);
});

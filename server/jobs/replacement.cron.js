const cron = require('node-cron');
const replacement = require('../models/replacement.model');

cron.schedule('1 0 * * *', async () => {
  try {
    const fechaActual = new Date();
    await replacement.updateMany(
      { fecha_termino: { $lt: fechaActual }, activo: true },
      { $set: { activo: false } }
    );
    console.log('✅ Cron ejecutado correctamente');
  } catch (error) {
    console.error('❌ Error en cron:', error);
  }
});

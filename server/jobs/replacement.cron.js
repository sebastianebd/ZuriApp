const cron = require('node-cron');
const replacement = require('../models/replacement.model');

cron.schedule('1 0 * * *', async () => {
  try {
    const fechaActual = new Date();
    const resultado = await replacement.updateMany(
      { fecha_termino: { $lt: fechaActual }, activo: true },
      { $set: { activo: false } }
    );

    if (resultado.modifiedCount > 0 && global.io) {
      global.io.emit('replacementsUpdated', {
        message: 'Reemplazos actualizados',
        count: resultado.modifiedCount
      });
    }

  } catch (error) {
    console.error('❌ Error en cron:', error);
  }
});

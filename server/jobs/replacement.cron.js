const cron = require('node-cron');
const Reemplazo = require('../models/Reemplazo');

cron.schedule('1 0 * * *', async () => {
  try {
    const fechaActual = new Date();
    await Reemplazo.updateMany(
      { fecha_termino: { $lt: fechaActual }, activo: true },
      { $set: { activo: false } }
    );
    console.log('✅ Cron ejecutado correctamente');
  } catch (error) {
    console.error('❌ Error en cron:', error);
  }
});

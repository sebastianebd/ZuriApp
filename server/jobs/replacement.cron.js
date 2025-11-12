const cron = require('node-cron');
const replacement = require('../models/replacement.model'); 

// La tarea se ejecuta a la 1 minuto después de la medianoche (1:01 AM)
cron.schedule('1 0 * * *', async () => {
  try {
    // 1. Obtener la fecha actual (solo la fecha, ignorando la hora)
    const hoy = new Date();
    // Ajustar a medianoche del día para comparaciones precisas de fechas
    hoy.setHours(0, 0, 0, 0); 
    
    // La fecha de mañana, usada para determinar el estado EN CURSO
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    // --- TRANSICIÓN 1: PENDIENTE/FUTURO A EN CURSO (Registros que inician hoy) ---
    // Buscamos registros que están PENDIENTE (status: 'PENDIENTE') 
    // y cuya fecha_inicio es igual o anterior a hoy.
    const transicionEnCurso = await replacement.updateMany(
      { 
        status: 'PENDIENTE',
        fecha_inicio: { $lte: hoy } 
      },
      { 
        $set: { status: 'EN CURSO' } 
      }
    );

    // --- TRANSICIÓN 2: EN CURSO A FINALIZADO (Registros que terminaron ayer) ---
    // Buscamos registros que están EN CURSO (status: 'EN CURSO')
    // y cuya fecha_termino es menor a hoy (terminó ayer o antes).
    const transicionFinalizada = await replacement.updateMany(
      { 
        status: 'EN CURSO',
        fecha_termino: { $lt: hoy } 
      },
      { 
        $set: { status: 'FINALIZADO' } 
      }
    );

    const totalModificados = transicionEnCurso.modifiedCount + transicionFinalizada.modifiedCount;

    if (totalModificados > 0 && global.io) {
      global.io.emit('replacementsUpdated', {
        message: 'Estados de reemplazos actualizados automáticamente',
        count: totalModificados
      });
    }
    
    console.log(`✅ Cron ejecutado. Transiciones: PENDIENTE->EN CURSO: ${transicionEnCurso.modifiedCount}, EN CURSO->FINALIZADO: ${transicionFinalizada.modifiedCount}`);

  } catch (error) {
    console.error('❌ Error en cron de estados:', error);
  }
});

const { getIO } = require('../config/socket'); 
const cron = require('node-cron');
const replacement = require('../models/replacement.model'); 

cron.schedule('53 11 * * *', async () => {
  try {
    const now = new Date();
    const fechaActual = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    

    const transicionEnCurso = await replacement.updateMany(
      { 
        status: 'PENDIENTE',
        fecha_inicio: { $lte: fechaActual } 
      },
      { 
        $set: { status: 'EN CURSO' } 
      }
    );

    const transicionFinalizada = await replacement.updateMany(
      { 
        status: 'EN CURSO',
        fecha_termino: { $lt: fechaActual },
      },
      { 
        $set: { status: 'FINALIZADO' } 
      }
    );

    const totalModificados = transicionEnCurso.modifiedCount + transicionFinalizada.modifiedCount;

    if (totalModificados > 0) {
      const io = getIO(); 
      io.emit('replacementsUpdated', {
        message: 'Estados de reemplazos actualizados automáticamente',
        count: totalModificados
      });
    }
    
    console.log(`✅ Cron ejecutado. Transiciones: PENDIENTE->EN CURSO: ${transicionEnCurso.modifiedCount}, EN CURSO->FINALIZADO: ${transicionFinalizada.modifiedCount}`);

  } catch (error) {
    console.error('❌ Error en cron de estados:', error);
  }
});
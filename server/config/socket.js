
let io;

// Función para inicializar la instancia de Socket.io
// Se llama una única vez cuando se levanta el servidor HTTP
const init = (httpServer) => {
    io = require('socket.io')(httpServer, {
        // Opciones de Socket.io, si las tienes
    });
    // Puedes poner aquí tu lógica de conexión, ej:
    io.on('connection', (socket) => {
        console.log('Cliente conectado a sockets');
    });
    return io;
};

// Función para obtener la instancia existente
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io no está inicializado.');
    }
    return io;
};

module.exports = {
    init,
    getIO
};
import { io } from 'socket.io-client'

// Si se define VITE_SOCKET_URL explícitamente se usa, de lo contrario se conecta
// a través del proxy de Vite (/socket.io) compartiendo el mismo origen y cookies
const socketUrl = import.meta.env.VITE_SOCKET_URL || undefined

const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  withCredentials: true,
  autoConnect: false, // Control connection manually
})

if (import.meta.env.DEV) {
  socket.on('connect', () => {
    console.log('🟢 [Socket.IO] Conectado exitosamente, id:', socket.id)
  })

  socket.on('connect_error', (err) => {
    console.warn('🔴 [Socket.IO] Error de conexión:', err.message)
  })

  socket.on('disconnect', (reason) => {
    console.log('🟡 [Socket.IO] Desconectado:', reason)
  })
}

export default socket

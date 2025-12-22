import { io } from 'socket.io-client'

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3500'
const socket = io(socketUrl, {
  transports: ['websocket'],
  withCredentials: true
})

export default socket

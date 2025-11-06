import { io } from 'socket.io-client'

// 🔹 Cambia la URL por la de tu backend
const socket = io('http://localhost:3500', {
  transports: ['websocket']
})

export default socket

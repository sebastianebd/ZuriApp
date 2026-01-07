import { io } from 'socket.io-client'

const socketUrl =
  import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:3500' : undefined)

const socket = io(socketUrl, {
  transports: ['websocket'],
  withCredentials: true,
  autoConnect: false // Control connection manually
})

export default socket

require('dotenv').config()
const mongoose = require('mongoose')
const connectDB = require('./config/db.config')
const app = require('./app')
const http = require('http')
const { Server } = require('socket.io')

const PORT = process.env.PORT || 3500

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL, 
    methods: ['GET', 'POST']
  }
})

global.io = io

io.on('connection', (socket) => {
  console.log(`🟢 Cliente conectado: ${socket.id}`)

  socket.on('disconnect', () => {
    console.log(`🔴 Cliente desconectado: ${socket.id}`)
  })
})

connectDB()

mongoose.connection.once('open', () => {
  console.log(`✅ DB connected: ${mongoose.connection.name}`)
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
})


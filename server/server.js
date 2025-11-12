require('dotenv').config()
const mongoose = require('mongoose')
const connectDB = require('./config/db.config')
const app = require('./app')
const http = require('http')
// Ya no necesitamos 'const { Server } = require('socket.io')'
const socketIO = require('./config/socket'); // Importamos nuestro módulo

const PORT = process.env.PORT || 3500

const server = http.createServer(app)


socketIO.init(server, process.env.CLIENT_URL); 

connectDB()

mongoose.connection.once('open', () => {
  console.log(`✅ DB connected: ${mongoose.connection.name}`)
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
})


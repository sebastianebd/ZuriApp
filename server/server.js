require('dotenv').config()
const mongoose = require('mongoose')
const connectDB = require('./config/db.config')
const app = require('./app')

const PORT = process.env.PORT || 3500

connectDB()

mongoose.connection.once('open', () => {
  console.log(`✅ DB connected: ${mongoose.connection.name}`)
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
})

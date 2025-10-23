const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const corsOptions = require('./config/cors.config');
const credentialsMiddleware = require('./middleware/credentials.middleware');
const errorHandlerMiddleware = require('./middleware/errorHandler.middleware');

const app = express();

app.use(credentialsMiddleware);
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', require('./routes/api/auth.routes'));
app.use('/api/users', require('./routes/api/users.routes'));
app.use('/api/reemplazos', require('./routes/api/replacement.routes'));
app.use('/api/options', require('./routes/api/options.routes'));

app.all('*', (req, res) => {
  res.status(404).json({ error: '404 Not Found' });
});

app.use(errorHandlerMiddleware);

module.exports = app;


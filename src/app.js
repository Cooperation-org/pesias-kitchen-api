const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

require('./config/database');

// Routes
app.use('/api/auth', require('./routes/goodDollarAuthRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/qr', require('./routes/qrRoutes'));
app.use('/api/participations', require('./routes/participationRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!'
  });
});

module.exports = app;
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const qrCodeRoutes = require('./routes/qrCode');
const activityRoutes = require('./routes/activity');
const userRoutes = require('./routes/user');
const eventRoutes = require('./routes/event');
const poolRoutes = require('./routes/pool');
const nftRoutes = require('./routes/nft');
const rewardsRoutes = require('./routes/rewards');
const analyticsRoutes= require('./routes/analytics')
const custodialRoutes = require('./routes/custodial');



const app = express();

app.use(helmet());
app.use(cors());

// app.use(cors({
//   origin: true, 
//   credentials: true
// }));
app.use(express.json());

connectDB()
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch(err => {
    console.error('Could not connect to MongoDB:', err);
    process.exit(1);
  });

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/qr', qrCodeRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/user', userRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/pool', poolRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/stats', analyticsRoutes);
app.use('/api/custodial', custodialRoutes);



app.get('/api/test', (req, res) => {
  res.json({ message: 'Pesia\'s Kitchen API is running!' });
});


app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Pesia\'s Kitchen API' });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
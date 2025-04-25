// src/app.js
require('dotenv').config();
const connectDB = require('./config/database');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Routes
const authRoutes = require('./routes/auth');
const qrCodeRoutes = require('./routes/qrCode');
const activityRoutes = require('./routes/activity');
const userRoutes = require('./routes/user');
const eventRoutes = require('./routes/event');
const poolRoutes = require('./routes/pool');
const nftRoutes = require('./routes/nft');



// dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('MongoDB connection error:', err));

connectDB()
  .then(() => {
    console.log('MongoDB connected');
    
    // Only start the server after DB connection succeeds
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Could not connect to MongoDB:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrCodeRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/user', userRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/pool', poolRoutes);
app.use('/api/nft', nftRoutes);



// Add this before your other routes
// Add to your test route
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  try {
    res.json({ message: 'Backend API is running!' });
    console.log('Response sent successfully');
  } catch (err) {
    console.error('Error sending response:', err);
    res.status(500).send('Error');
  }
});
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




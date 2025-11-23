console.log('Server.js file executed.');

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const telegramRoutes = require('./routes/telegram');
const userRoutes = require('./routes/users');
const path = require('path');

dotenv.config();

connectDB();

const cron = require('node-cron');
const { exec } = require('child_process');

// Jadwalkan tugas untuk memeriksa produk kedaluwarsa setiap hari pada jam 00:00 (tengah malam)
cron.schedule('0 0 * * *', () => {
  console.log('Menjalankan tugas terjadwal: memeriksa produk kedaluwarsa...');
  exec('node scripts/checkExpiredProducts.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}, {
  scheduled: true,
  timezone: "Asia/Jakarta" // Sesuaikan dengan zona waktu Anda
});

const app = express();

console.log('Express app initialized.');

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'x-auth-token', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' http://localhost:3001;");
  next();
});

app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.originalUrl);
  next();
});

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/users', userRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Keep the process alive
process.stdin.resume();

process.on('SIGINT', () => {
  console.log('Server shutting down...');
  server.close(() => {
    console.log('Server gracefully terminated.');
    process.exit(0);
  });
});

module.exports = app;
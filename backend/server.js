console.log('Server.js file executed.');

// Polyfill for File class if not available (fixes "File is not defined" error in Node 18)
if (typeof global.File === 'undefined') {
  const { File } = require('buffer');
  global.File = File;
}

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables immediately
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: path.join(__dirname, '.env.development') });
} else {
  dotenv.config({ path: path.join(__dirname, '.env') });
}

const connectDB = require('./config/db');
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const telegramRoutes = require('./routes/telegram');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const fieldStaffRoutes = require('./routes/fieldStaff');
const orderRoutes = require('./routes/orders');
const cashflowRoutes = require('./routes/cashflow');
const balanceTransactionRoutes = require('./routes/balance-transactions');
const handphoneRoutes = require('./routes/handphone');
const backupRoutes = require('./routes/backup');
const menuPermissionRoutes = require('./routes/menuPermissions');




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
console.log('NODE_ENV:', process.env.NODE_ENV);
// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3003',
      'http://localhost:5173',
      'https://website-aksesoris.vercel.app',
      'https://website-aksesoris-git-main-windhydevelop-sys.vercel.app',
      // Railway frontend URLs
      'https://website-aksesoris-frontend-production.up.railway.app',
      'https://website-aksesoris-frontend-staging.up.railway.app',
      // NEW: Render backend URL
      'https://website-aksesoris.onrender.app',
      // Railway deployment URLs with random subdomains
      /\.railway\.app$/,
      // Allow all vercel deployments
      /\.vercel\.app$/,
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // In development, allow all origins if no specific origin is set
    if (process.env.NODE_ENV === 'development' && process.env.ALLOW_ALL_ORIGINS === 'true') {
      console.log('Development mode: allowing all origins');
      return callback(null, true);
    }

    // Check if origin matches any allowed pattern
    for (let i = 0; i < allowedOrigins.length; i++) {
      const allowed = allowedOrigins[i];

      if (allowed instanceof RegExp) {
        if (allowed.test(origin)) {
          console.log('CORS allowed origin (regex):', origin);
          return callback(null, true);
        }
      } else if (allowed === origin) {
        console.log('CORS allowed origin (exact):', origin);
        return callback(null, true);
      }
    }

    console.log('CORS blocked origin:', origin);

    // Log more details for debugging
    console.log('Request headers:', origin);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Frontend URL env:', process.env.FRONTEND_URL);

    // In production, be more restrictive, in development allow with warning
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error('Not allowed by CORS'));
    } else {
      console.warn('Development mode: allowing blocked origin for testing');
      return callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'x-auth-token', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.originalUrl);

  // Ultra-permissive CSP for development to fix favicon/image loading issues
  res.removeHeader('Content-Security-Policy');
  res.setHeader(
    'Content-Security-Policy',
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
  );
  next();
});

// Handle favicon to prevent 404s and CSP errors
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Website Aksesoris API</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; }
        .container { text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #1a73e8; margin-bottom: 0.5rem; }
        p { color: #5f6368; }
        .status { display: inline-block; padding: 0.25rem 0.75rem; background: #e6f4ea; color: #1e8e3e; border-radius: 999px; font-size: 0.875rem; font-weight: 500; margin-top: 1rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Website Aksesoris API</h1>
        <p>Backend server is running successfully.</p>
        <div class="status">● System Operational</div>
      </div>
    </body>
    </html>
  `);
});

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/field-staff', fieldStaffRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cashflow', cashflowRoutes);
app.use('/api/balance-transactions', balanceTransactionRoutes);
app.use('/api/handphones', handphoneRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/menu-permissions', menuPermissionRoutes);
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

// Seed admin endpoint (for development/testing)
app.get('/api/auth/seed-admin', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const path = require('path');

    exec('node scripts/seedAdmin.js', { cwd: path.join(__dirname) }, (error, stdout, stderr) => {
      if (error) {
        console.error('Seed admin error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to seed admin user',
          details: error.message
        });
      }

      if (stderr) {
        console.error('Seed admin stderr:', stderr);
      }

      console.log('Seed admin stdout:', stdout);

      res.json({
        success: true,
        message: 'Admin user seeded successfully',
        credentials: {
          username: 'admin',
          email: 'admin@example.com',
          password: 'admin123'
        },
        output: stdout
      });
    });

  } catch (err) {
    console.error('Seed admin route error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to seed admin user',
      details: err.message
    });
  }
});

const PORT = process.env.PORT || 5000;

// Global server variable for graceful shutdown
let server;

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// Keep the process alive
process.stdin.resume();

process.on('SIGINT', () => {
  console.log('Server shutting down...');
  if (server) {
    server.close(() => {
      console.log('Server gracefully terminated.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

module.exports = app;
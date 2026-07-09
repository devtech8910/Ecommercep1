import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { query } from './db.js';
import locationRouter from './modules/location/routes/location.routes.js';
import addressRouter from './modules/address/routes/address.routes.js';
import authRouter from './modules/auth/routes/auth.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'devtech_fashion_secret_key';

// Enable CORS for frontend requests
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins in local development (handles custom localhost ports, file://, etc.)
    callback(null, true);
  },
  credentials: true
}));

// Parse application/json bodies
app.use(express.json());

// JWT Authentication middleware with fallback for backward compatibility
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
    } catch (err) {
      console.warn('JWT verify failed, falling back to mock user:', err.message);
      req.userId = 1;
    }
  } else {
    // Default fallback to first user in database (if exists), otherwise default to 1
    try {
      const result = await query('SELECT id FROM users ORDER BY id LIMIT 1;');
      req.userId = result.rows[0] ? result.rows[0].id : 1;
    } catch (e) {
      req.userId = 1;
    }
  }
  next();
});

// Expose API routes
app.use('/auth', authRouter);
app.use('/location', locationRouter);
app.use('/address', addressRouter);

// Welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the DevTech Fashion E-Commerce API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      location: '/location',
      address: '/address'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Express uncaught error:', err);
  res.status(500).json({ success: false, error: 'An unexpected server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Address Picker API Server running on port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
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
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
    } catch (err) {
      console.warn('JWT verify failed, falling back to mock user:', err.message);
      req.userId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
    }
  } else {
    // Default fallback to pre-seeded customer user UUID for backward compatibility
    req.userId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
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

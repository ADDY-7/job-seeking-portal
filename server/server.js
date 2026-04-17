require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// ─── Connect to MongoDB Atlas ─────────────────────────────────────────────────
connectDB();

const app = express();

// ─── Security Middleware (AWS Assignment 4 – Networking & Security) ───────────

// Helmet sets secure HTTP headers:
// Content-Security-Policy, HSTS, X-Frame-Options, X-XSS-Protection, etc.
app.use(helmet());

// CORS – restrict to frontend origin only
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Rate limiting on auth routes (brute-force protection)
// On AWS: this is the application-layer control; ALB WAF rules add a second layer
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // max 20 auth attempts per IP per window
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Global rate limiter for all API routes
const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 200,
  message: { success: false, message: 'Rate limit exceeded' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

// Body parser
app.use(express.json({ limit: '10kb' })); // prevent large payload attacks

// ─── Health Check (used by AWS ALB target group health checks) ────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  CareerNest API running on port ${PORT} [${process.env.NODE_ENV}]`);
  console.log(`🔒  Security: Helmet + CORS + Rate Limiting active`);
  console.log(`❤️   Health check: http://localhost:${PORT}/api/health`);
});

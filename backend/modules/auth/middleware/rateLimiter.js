// ============================================================
// FASHION COMPANY — AUTHENTICATION RATE LIMITING & SECURITY MIDDLEWARE
// Defends against brute-force password guessing, credential stuffing, & OTP spam
// ============================================================

// Memory store for tracking failed login attempts: key -> { count: number, resetAt: number, blockedUntil: number }
const failedLoginStore = new Map();

// Memory store for tracking OTP requests: key -> { count: number, lastRequestedAt: number, resetAt: number }
const otpRequestStore = new Map();

// Clean up expired records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of failedLoginStore.entries()) {
    if (now > data.resetAt && now > data.blockedUntil) {
      failedLoginStore.delete(key);
    }
  }
  for (const [key, data] of otpRequestStore.entries()) {
    if (now > data.resetAt) {
      otpRequestStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.socket?.remoteAddress ||
         '127.0.0.1';
}

/**
 * Middleware: Enforces failed login rate limit (max 5 failed attempts per 15 min per IP)
 */
export function loginRateLimiter(req, res, next) {
  const ip = getClientIp(req);
  const email = (req.body?.email || '').trim().toLowerCase();
  const key = `${ip}_${email}`;
  const now = Date.now();

  const record = failedLoginStore.get(key) || failedLoginStore.get(ip);
  if (record && record.blockedUntil && now < record.blockedUntil) {
    const remainingSec = Math.ceil((record.blockedUntil - now) / 1000);
    return res.status(429).json({
      success: false,
      errors: [`Too many failed login attempts. Please wait ${remainingSec} seconds before trying again.`]
    });
  }

  next();
}

/**
 * Record a failed login attempt for the client IP / email
 */
export function recordFailedLogin(req, email = '') {
  const ip = getClientIp(req);
  const cleanEmail = String(email).trim().toLowerCase();
  const key = `${ip}_${cleanEmail}`;
  const now = Date.now();
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_FAILED = 5;
  const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

  const record = failedLoginStore.get(key) || { count: 0, resetAt: now + WINDOW_MS, blockedUntil: 0 };
  
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + WINDOW_MS;
    record.blockedUntil = 0;
  } else {
    record.count += 1;
  }

  if (record.count >= MAX_FAILED) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    console.warn(`🚨 [SECURITY ALERT] Rate limit triggered: ${ip} (${cleanEmail}) blocked for 15 minutes after ${record.count} failed attempts.`);
  }

  failedLoginStore.set(key, record);
  failedLoginStore.set(ip, record);
}

/**
 * Clear failed attempts upon successful login
 */
export function recordSuccessfulLogin(req, email = '') {
  const ip = getClientIp(req);
  const cleanEmail = String(email).trim().toLowerCase();
  const key = `${ip}_${cleanEmail}`;
  failedLoginStore.delete(key);
  failedLoginStore.delete(ip);
}

/**
 * Middleware / Validator for OTP requests (60s cooldown, max 5 / 15m)
 */
export function checkOtpRateLimit(identifier) {
  const key = String(identifier).trim().toLowerCase();
  const now = Date.now();
  const COOLDOWN_MS = 60 * 1000; // 60 seconds
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_OTP_PER_WINDOW = 5;

  const record = otpRequestStore.get(key) || { count: 0, lastRequestedAt: 0, resetAt: now + WINDOW_MS };

  // Check 60-second cooldown
  if (record.lastRequestedAt && (now - record.lastRequestedAt) < COOLDOWN_MS) {
    const waitSec = Math.ceil((COOLDOWN_MS - (now - record.lastRequestedAt)) / 1000);
    throw new Error(`Please wait ${waitSec} seconds before requesting a new OTP code.`);
  }

  // Check 15-minute window limit
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + WINDOW_MS;
  } else {
    record.count += 1;
    if (record.count > MAX_OTP_PER_WINDOW) {
      throw new Error('Too many OTP requests. Please wait 15 minutes before trying again.');
    }
  }

  record.lastRequestedAt = now;
  otpRequestStore.set(key, record);
}

export default {
  loginRateLimiter,
  recordFailedLogin,
  recordSuccessfulLogin,
  checkOtpRateLimit
};

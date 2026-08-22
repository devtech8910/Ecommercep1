// ============================================================
// FASHION COMPANY — CENTRALIZED JWT SECURITY CONFIGURATION
// Authoritative source for JWT secret management
// ============================================================

import dotenv from 'dotenv';
dotenv.config();

let cachedSecret = null;

export function getJwtSecret() {
  if (cachedSecret) return cachedSecret;

  const envSecret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!envSecret || envSecret.trim() === '') {
    if (isProduction) {
      console.error('❌ [FATAL SECURITY ERROR] JWT_SECRET environment variable is missing in production!');
      throw new Error('FATAL: JWT_SECRET environment variable must be set in production mode. Server refusing to start with an insecure secret.');
    } else {
      console.warn('⚠️ [Fashion Company Security Warning] Using development-only JWT fallback secret. Ensure JWT_SECRET is set in production.');
      cachedSecret = 'fashion_company_dev_secret_key_non_production';
      return cachedSecret;
    }
  }

  cachedSecret = envSecret.trim();
  return cachedSecret;
}

export default { getJwtSecret };

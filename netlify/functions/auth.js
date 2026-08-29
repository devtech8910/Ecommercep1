// ============================================================
// FASHIONCOMPANY FASHION — NETLIFY SERVERLESS CLOUD AUTHENTICATION
// Enables 24/7 global multi-device login across Mobile & Desktop
// ============================================================

import bcrypt from 'bcryptjs';

const CLOUD_DB_URL = process.env.CLOUD_DB_URL || 'https://jsonblob.com/api/jsonBlob/019f9cba-929a-7931-ad23-922a9b668aa9';

const adminPasswordHash = process.env.DEFAULT_ADMIN_PASSWORD_HASH || '';

// Default Admin users seeded automatically across Netlify & Cloud DB
const DEFAULT_ADMINS = [
  { name: 'Fashion Company Administrator', email: 'admin@fashioncompany.com', phone: '9999999999', dob: '1990-01-01', password: adminPasswordHash, role: 'admin', token: 'dtf_token_admin_1' },
  { name: 'Fashion Company Administrator', email: 'fashioncompanyadmin@gmail.com', phone: '9999999999', dob: '1990-01-01', password: adminPasswordHash, role: 'admin', token: 'dtf_token_admin_2' }
].filter(user => user.password);

let memoryUsersCache = null;

// Failed login attempt tracker (in-memory sliding window)
const failedLoginAttempts = new Map();

function checkLoginRateLimit(key) {
  if (!key) return null;
  const cleanKey = String(key).trim().toLowerCase();
  const record = failedLoginAttempts.get(cleanKey);
  const now = Date.now();
  if (record && record.blockedUntil && now < record.blockedUntil) {
    const waitSec = Math.ceil((record.blockedUntil - now) / 1000);
    return `Too many failed login attempts. Please wait ${waitSec} seconds before trying again.`;
  }
  return null;
}

function recordFailedAttempt(key) {
  if (!key) return;
  const cleanKey = String(key).trim().toLowerCase();
  const now = Date.now();
  const WINDOW_MS = 15 * 60 * 1000;
  const BLOCK_MS = 15 * 60 * 1000;
  const record = failedLoginAttempts.get(cleanKey) || { count: 0, resetAt: now + WINDOW_MS, blockedUntil: 0 };

  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + WINDOW_MS;
    record.blockedUntil = 0;
  } else {
    record.count += 1;
  }

  if (record.count >= 5) {
    record.blockedUntil = now + BLOCK_MS;
  }
  failedLoginAttempts.set(cleanKey, record);
}

function clearFailedAttempts(key) {
  if (!key) return;
  failedLoginAttempts.delete(String(key).trim().toLowerCase());
}

function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
}

function stripSensitiveUserFields(user) {
  if (!user) return user;
  const {
    password,
    password_hash,
    passwordHash,
    resetOtp,
    resetOtpHash,
    resetOtpExpiresAt,
    resetOtpRequestedAt,
    resetOtpRequestCount,
    ...safeUser
  } = user;
  return safeUser;
}

function createToken() {
  if (globalThis.crypto?.randomUUID) return 'dtf_token_' + globalThis.crypto.randomUUID();
  return 'dtf_token_' + Date.now() + '_' + Math.random().toString(36).slice(2);
}

async function getCloudUsers() {
  try {
    const res = await fetch(CLOUD_DB_URL, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      let users = Array.isArray(data) ? data : [];
      let updated = false;
      DEFAULT_ADMINS.forEach(adm => {
        if (!users.some(u => u && u.email && u.email.toLowerCase() === adm.email.toLowerCase())) {
          users.push(adm);
          updated = true;
        }
      });
      if (updated) {
        saveCloudUsers(users);
      }
      memoryUsersCache = users;
      return users;
    }
  } catch (err) {
    console.warn('[Netlify Auth] Cloud fetch error, using memory cache:', err.message);
  }
  return memoryUsersCache || DEFAULT_ADMINS;
}

async function saveCloudUsers(users) {
  memoryUsersCache = users;
  try {
    await fetch(CLOUD_DB_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(users)
    });
  } catch (err) {
    console.warn('[Netlify Auth] Cloud save error:', err.message);
  }
}

async function sendResetOtpEmail(email, otp, name) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_PASSWORD_RESET_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) return false;

  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        to_email: email,
        otp_code: otp,
        to_name: name || 'Fashion Company Member'
      }
    })
  });

  if (!res.ok) {
    throw new Error(`Email OTP delivery failed with status ${res.status}.`);
  }

  return true;
}

export async function handler(event, context) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': event.headers?.origin || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'OK' }) };
  }

  const clientIp = event.headers?.['client-ip'] || event.headers?.['x-forwarded-for']?.split(',')[0].trim() || 'serverless_client';

  try {
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        body = {};
      }
    }

    const queryParams = event.queryStringParameters || {};
    const path = event.path || '';
    
    // Determine action from path or body
    let action = body.action || queryParams.action;
    if (!action) {
      if (path.includes('register')) action = 'register';
      else if (path.includes('login')) action = 'login';
      else if (path.includes('check-email')) action = 'check-email';
      else if (path.includes('reset-password')) action = 'reset-password';
      else if (path.includes('delete-account')) action = 'delete-account';
    }

    const users = await getCloudUsers();

    // === 1. CHECK EMAIL EXISTENCE ===
    if (action === 'check-email' || queryParams.email) {
      const targetEmail = (queryParams.email || body.email || '').trim().toLowerCase();
      if (!targetEmail) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, errors: ['Email is required.'] }) };
      }
      const exists = users.some(u => u.email && u.email.toLowerCase() === targetEmail);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, exists }) };
    }

    // === 2. REGISTER USER ===
    if (action === 'register') {
      const { name, email, phone, dob, password } = body;
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, errors: ['Email and password are required.'] }) };
      }

      const existingUser = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (existingUser) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, errors: ['An account with this email address already exists. Please login or use a different email.'] }) };
      }

      const newUser = {
        name: name || 'Fashion Company Member',
        email: cleanEmail,
        phone: phone || '',
        dob: dob || '',
        password: await bcrypt.hash(password, 10),
        role: body.role || 'customer',
        token: createToken(),
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      await saveCloudUsers(users);

      return {
        statusCode: 201,
        headers: {
          ...headers,
          'Set-Cookie': `dtf_token=${newUser.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
        },
        body: JSON.stringify({ success: true, user: stripSensitiveUserFields(newUser), token: newUser.token })
      };
    }

    // === 3. LOGIN USER (Rate-Limited, Generic Error, Enumeration Protected) ===
    if (action === 'login') {
      const { email, password } = body;
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, errors: ['Email and password are required.'] }) };
      }

      // Check Rate Limits (Client IP & Email)
      const ipBlocked = checkLoginRateLimit(clientIp);
      const emailBlocked = checkLoginRateLimit(cleanEmail);
      if (ipBlocked || emailBlocked) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({ success: false, errors: [ipBlocked || emailBlocked] })
        };
      }

      const foundUser = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (!foundUser) {
        recordFailedAttempt(clientIp);
        recordFailedAttempt(cleanEmail);
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, errors: ['Invalid email or password.'] }) };
      }

      let isPasswordMatch = false;
      let passwordUpgraded = false;

      if (isBcryptHash(foundUser.password)) {
        isPasswordMatch = await bcrypt.compare(password, foundUser.password);
      } else if (typeof foundUser.password === 'string' && foundUser.password.length > 0) {
        isPasswordMatch = foundUser.password === password;
        if (isPasswordMatch) {
          foundUser.password = await bcrypt.hash(password, 10);
          passwordUpgraded = true;
        }
      }

      if (!isPasswordMatch) {
        recordFailedAttempt(clientIp);
        recordFailedAttempt(cleanEmail);
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, errors: ['Invalid email or password.'] }) };
      }

      // Login Succeeded: Clear failed attempt counters
      clearFailedAttempts(clientIp);
      clearFailedAttempts(cleanEmail);

      if (!foundUser.token) {
        foundUser.token = createToken();
        passwordUpgraded = true;
      }

      // Check 30-day deletion grace period
      let deletionCancelled = false;
      if (foundUser.deletionScheduled) {
        const deletionExpiry = foundUser.deletionDate ? new Date(foundUser.deletionDate).getTime() : 0;
        const now = Date.now();

        if (deletionExpiry > 0 && now > deletionExpiry) {
          // Deletion period expired — account permanently purged
          const filteredUsers = users.filter(u => !(u.email && u.email.toLowerCase() === cleanEmail));
          await saveCloudUsers(filteredUsers);
          return { statusCode: 410, headers, body: JSON.stringify({ success: false, errors: ['This account was permanently deleted after the 30-day grace period.'] }) };
        } else {
          // Within 30-day period — cancel deletion automatically!
          foundUser.deletionScheduled = false;
          delete foundUser.deletionDate;
          deletionCancelled = true;
          passwordUpgraded = true;
        }
      }

      if (passwordUpgraded || deletionCancelled) {
        const updatedUsers = users.map(u => (u.email && u.email.toLowerCase() === cleanEmail) ? foundUser : u);
        await saveCloudUsers(updatedUsers);
      }

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Set-Cookie': `dtf_token=${foundUser.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
        },
        body: JSON.stringify({
          success: true,
          user: stripSensitiveUserFields(foundUser),
          token: foundUser.token,
          deletionCancelled
        })
      };
    }

    // === 4. REQUEST RESET OTP (Server-Side 60s Cooldown & Rate Limit) ===
    if (action === 'request-reset-otp') {
      const cleanEmail = (body.email || '').trim().toLowerCase();

      if (!cleanEmail) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, errors: ['Email is required.'] }) };
      }

      const idx = users.findIndex(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (idx === -1) {
        // Return generic success to eliminate user enumeration
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'If an account exists with this email address, a password reset OTP has been sent.',
            otpSent: false
          })
        };
      }

      const targetUser = users[idx];
      const now = Date.now();
      const COOLDOWN_MS = 60 * 1000; // 60 seconds

      // Server-side OTP cooldown enforcement
      if (targetUser.resetOtpRequestedAt) {
        const lastRequested = new Date(targetUser.resetOtpRequestedAt).getTime();
        if (now - lastRequested < COOLDOWN_MS) {
          const waitSec = Math.ceil((COOLDOWN_MS - (now - lastRequested)) / 1000);
          return {
            statusCode: 429,
            headers,
            body: JSON.stringify({
              success: false,
              errors: [`Please wait ${waitSec} seconds before requesting another OTP code.`]
            })
          };
        }
      }

      // Check request count (max 5 in 15 minutes)
      const windowStart = targetUser.resetOtpWindowStart ? new Date(targetUser.resetOtpWindowStart).getTime() : 0;
      if (now - windowStart > 15 * 60 * 1000) {
        targetUser.resetOtpWindowStart = new Date(now).toISOString();
        targetUser.resetOtpRequestCount = 1;
      } else {
        targetUser.resetOtpRequestCount = (targetUser.resetOtpRequestCount || 0) + 1;
        if (targetUser.resetOtpRequestCount > 5) {
          return {
            statusCode: 429,
            headers,
            body: JSON.stringify({
              success: false,
              errors: ['Too many OTP requests. Please wait 15 minutes before trying again.']
            })
          };
        }
      }

      const otp = String(Math.floor(100000 + Math.random() * 900000));
      targetUser.resetOtpHash = await bcrypt.hash(otp, 10);
      targetUser.resetOtpExpiresAt = new Date(now + 10 * 60 * 1000).toISOString(); // 10 minutes
      targetUser.resetOtpRequestedAt = new Date(now).toISOString();
      delete targetUser.resetOtp;

      const otpSent = await sendResetOtpEmail(cleanEmail, otp, targetUser.name);
      await saveCloudUsers(users);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: otpSent
            ? 'Password reset OTP has been sent.'
            : 'Password reset OTP generated, but email delivery is not configured.',
          otpSent
        })
      };
    }

    // === 5. RESET PASSWORD ===
    if (action === 'reset-password') {
      const { email, newPassword } = body;
      const otp = String(body.otp || '').trim();
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail || !otp || !newPassword) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, errors: ['Email, OTP, and new password are required.'] }) };
      }

      const userIdx = users.findIndex(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (userIdx === -1) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, errors: ['Invalid password reset request.'] }) };
      }

      const targetUser = users[userIdx];
      if (!targetUser.resetOtpHash || !targetUser.resetOtpExpiresAt) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, errors: ['A valid password reset OTP is required.'] }) };
      }

      if (Date.now() > new Date(targetUser.resetOtpExpiresAt).getTime()) {
        delete targetUser.resetOtpHash;
        delete targetUser.resetOtpExpiresAt;
        await saveCloudUsers(users);
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, errors: ['This password reset OTP has expired. Please request a new one.'] }) };
      }

      const otpMatches = await bcrypt.compare(otp, targetUser.resetOtpHash);
      if (!otpMatches) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, errors: ['Invalid password reset OTP code.'] }) };
      }

      targetUser.password = await bcrypt.hash(newPassword, 10);
      targetUser.token = createToken();
      delete targetUser.resetOtpHash;
      delete targetUser.resetOtpExpiresAt;
      delete targetUser.resetOtpRequestedAt;
      delete targetUser.resetOtpRequestCount;
      delete targetUser.resetOtpWindowStart;

      await saveCloudUsers(users);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Password reset successfully.' }) };
    }

    // === 6. DELETE ACCOUNT (SCHEDULE FOR 30 DAYS) ===
    if (action === 'delete-account') {
      const { email } = body;
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, errors: ['Email is required.'] }) };
      }

      let found = false;
      const updatedUsers = users.map(u => {
        if (u.email && u.email.toLowerCase() === cleanEmail) {
          u.deletionScheduled = true;
          u.deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          found = true;
        }
        return u;
      });

      if (found) {
        await saveCloudUsers(updatedUsers);
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Account deletion scheduled for 30 days.' }) };
    }

    // === 7. UPDATE PROFILE ===
    if (action === 'update-profile' || action === 'verify-and-update-profile') {
      const authHeader = event.headers.authorization || event.headers.Authorization || '';
      const token = authHeader.replace('Bearer ', '').trim();
      
      if (!token) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, errors: ['Unauthorized.'] }) };
      }

      const { firstName, lastName, email, phone, dob } = body;
      const cleanEmail = (email || '').trim().toLowerCase();

      let targetUser = users.find(u => u.token === token);
      if (!targetUser) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, errors: ['Invalid token.'] }) };
      }

      // If email is changed, check if new email exists
      if (cleanEmail && cleanEmail !== targetUser.email.toLowerCase()) {
        const emailExists = users.some(u => u.email && u.email.toLowerCase() === cleanEmail);
        if (emailExists) {
          return { statusCode: 400, headers, body: JSON.stringify({ success: false, errors: ['Email is already in use by another account.'] }) };
        }
      }

      targetUser.first_name = firstName || targetUser.first_name || '';
      targetUser.last_name = lastName || targetUser.last_name || '';
      targetUser.name = `${targetUser.first_name} ${targetUser.last_name}`.trim() || targetUser.name;
      targetUser.email = cleanEmail || targetUser.email;
      targetUser.phone = phone || targetUser.phone;
      targetUser.date_of_birth = dob || targetUser.date_of_birth || targetUser.dob;
      targetUser.dob = targetUser.date_of_birth;

      const year = new Date().getFullYear();
      targetUser.profileEditLimit = targetUser.profileEditLimit || { limit: 2, used: 0, remaining: 2, year };
      if (targetUser.profileEditLimit.year !== year) {
        targetUser.profileEditLimit = { limit: 2, used: 0, remaining: 2, year };
      }
      targetUser.profileEditLimit.used += 1;
      targetUser.profileEditLimit.remaining = Math.max(targetUser.profileEditLimit.limit - targetUser.profileEditLimit.used, 0);

      await saveCloudUsers(users);

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: stripSensitiveUserFields(targetUser) }) };
    }

    // === 8. SEND VERIFICATION OTP ===
    if (action === 'send-verification-otp') {
      // Stub: return a static dev OTP for testing without sending real emails/SMS
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, devOtp: '123456' }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ success: false, errors: ['Invalid API action.'] }) };

  } catch (error) {
    console.error('[Netlify Auth Error]:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, errors: ['Server internal error: ' + error.message] })
    };
  }
}

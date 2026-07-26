// ============================================================
// DEVTECH FASHION — NETLIFY SERVERLESS CLOUD AUTHENTICATION
// Enables 24/7 global multi-device login across Mobile & Desktop
// ============================================================

const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID || '67c8be37e4104c4768ab5432';
const JSONBIN_SECRET = process.env.JSONBIN_SECRET || '$2a$10$VjQ3jU4w7J.z4k2H8L5Xn.X2P4Q1W0E9R8T7Y6U5I4O3P2A1S0D9F';

// In-memory fallback cache for fast serverless execution
let memoryUsersCache = null;

async function getCloudUsers() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': JSONBIN_SECRET
      }
    });
    if (res.ok) {
      const data = await res.json();
      const users = Array.isArray(data.record) ? data.record : [];
      memoryUsersCache = users;
      return users;
    }
  } catch (err) {
    console.warn('[Netlify Auth] Cloud fetch error, using memory cache:', err.message);
  }
  return memoryUsersCache || [];
}

async function saveCloudUsers(users) {
  memoryUsersCache = users;
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_SECRET
      },
      body: JSON.stringify(users)
    });
  } catch (err) {
    console.warn('[Netlify Auth] Cloud save error:', err.message);
  }
}

export async function handler(event, context) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'OK' }) };
  }

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
        name: name || 'DevTech Member',
        email: cleanEmail,
        phone: phone || '',
        dob: dob || '',
        password: password,
        role: 'customer',
        token: 'dtf_token_' + Date.now(),
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      await saveCloudUsers(users);

      const { password: _, ...userWithoutPassword } = newUser;
      return { statusCode: 201, headers, body: JSON.stringify({ success: true, user: newUser, token: newUser.token }) };
    }

    // === 3. LOGIN USER ===
    if (action === 'login') {
      const { email, password } = body;
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, errors: ['Email and password are required.'] }) };
      }

      const foundUser = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (!foundUser) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, errors: ['No account found with this email address. Please check your email or sign up.'] }) };
      }

      if (foundUser.password && foundUser.password !== password) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, errors: ['Incorrect password. Please enter the correct password.'] }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, user: foundUser, token: foundUser.token || ('dtf_token_' + Date.now()) }) };
    }

    // === 4. RESET PASSWORD ===
    if (action === 'reset-password') {
      const { email, newPassword } = body;
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail || !newPassword) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, errors: ['Email and new password are required.'] }) };
      }

      let userFound = false;
      const updatedUsers = users.map(u => {
        if (u.email && u.email.toLowerCase() === cleanEmail) {
          u.password = newPassword;
          userFound = true;
        }
        return u;
      });

      if (!userFound) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, errors: ['No account found with this email address.'] }) };
      }

      await saveCloudUsers(updatedUsers);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Password reset successfully.' }) };
    }

    // === 5. DELETE ACCOUNT ===
    if (action === 'delete-account') {
      const { email } = body;
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, errors: ['Email is required.'] }) };
      }

      const filteredUsers = users.filter(u => !(u.email && u.email.toLowerCase() === cleanEmail));
      await saveCloudUsers(filteredUsers);

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Account deleted successfully.' }) };
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

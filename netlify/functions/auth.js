// ============================================================
// DEVTECH FASHION — NETLIFY SERVERLESS CLOUD AUTHENTICATION
// Enables 24/7 global multi-device login across Mobile & Desktop
// ============================================================

const CLOUD_DB_URL = process.env.CLOUD_DB_URL || 'https://jsonblob.com/api/jsonBlob/019f9cba-929a-7931-ad23-922a9b668aa9';

// Default Admin user seeded automatically
const DEFAULT_ADMIN = {
  name: 'DevTech Administrator',
  email: 'admin@devtech.com',
  phone: '9999999999',
  dob: '1990-01-01',
  password: 'Purna@2007',
  role: 'admin',
  token: 'dtf_token_admin_global'
};

let memoryUsersCache = null;

async function getCloudUsers() {
  try {
    const res = await fetch(CLOUD_DB_URL, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      let users = Array.isArray(data) ? data : [];
      if (!users.some(u => u.email && u.email.toLowerCase() === 'admin@devtech.com')) {
        users.push(DEFAULT_ADMIN);
        saveCloudUsers(users);
      }
      memoryUsersCache = users;
      return users;
    }
  } catch (err) {
    console.warn('[Netlify Auth] Cloud fetch error, using memory cache:', err.message);
  }
  return memoryUsersCache || [DEFAULT_ADMIN];
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
        role: body.role || 'customer',
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

          const updatedUsers = users.map(u => (u.email && u.email.toLowerCase() === cleanEmail) ? foundUser : u);
          await saveCloudUsers(updatedUsers);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: foundUser,
          token: foundUser.token || ('dtf_token_' + Date.now()),
          deletionCancelled
        })
      };
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

    // === 5. DELETE ACCOUNT (SCHEDULE FOR 30 DAYS) ===
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

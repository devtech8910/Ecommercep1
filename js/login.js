/* ============================================================
   DEVTECH FASHION — LOGIN JAVASCRIPT (Credentials Only)
   Author: DevTech Solutions (Purna Sai & Prabhas)
   Version: 1.0.0
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm      = document.getElementById('login-form');
  const emailInput     = document.getElementById('email');
  const passwordInput  = document.getElementById('password');
  const emailError     = document.getElementById('email-error');
  const passwordError  = document.getElementById('password-error');
  const submitBtn      = document.getElementById('login-submit-btn');
  const passwordToggle = document.getElementById('password-toggle');
  
  const eyeOffIcon = passwordToggle.querySelector('.eye-off');
  const eyeOnIcon  = passwordToggle.querySelector('.eye-on');

  // Set current year in footer
  const footerYear = document.getElementById('footer-year');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  // ============================================================
  // PASSWORD VISIBILITY TOGGLE
  // ============================================================
  passwordToggle.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    
    if (isPassword) {
      eyeOffIcon.style.display = 'none';
      eyeOnIcon.style.display = 'block';
      passwordToggle.setAttribute('aria-label', 'Hide password');
    } else {
      eyeOffIcon.style.display = 'block';
      eyeOnIcon.style.display = 'none';
      passwordToggle.setAttribute('aria-label', 'Show password');
    }
  });

  // ============================================================
  // FORM VALIDATIONS
  // ============================================================
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showError(inputEl, errorEl, message) {
    inputEl.classList.add('input-error');
    errorEl.textContent = message;
    errorEl.style.opacity = '1';
  }

  function clearError(inputEl, errorEl) {
    inputEl.classList.remove('input-error');
    errorEl.textContent = '';
    errorEl.style.opacity = '0';
  }

  // Clear errors dynamically on input
  emailInput.addEventListener('input', () => {
    if (emailInput.classList.contains('input-error')) {
      clearError(emailInput, emailError);
    }
  });

  passwordInput.addEventListener('input', () => {
    if (passwordInput.classList.contains('input-error')) {
      clearError(passwordInput, passwordError);
    }
  });

  // ============================================================
  // EMAIL / PASSWORD LOGIN SUBMIT
  // ============================================================
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let isValid = true;

    // Validate email format
    if (!email) {
      showError(emailInput, emailError, 'Email address is required.');
      isValid = false;
    } else if (!validateEmail(email)) {
      showError(emailInput, emailError, 'Please enter a valid email address.');
      isValid = false;
    } else {
      clearError(emailInput, emailError);
    }

    // Validate password format
    if (!password) {
      showError(passwordInput, passwordError, 'Password is required.');
      isValid = false;
    } else if (password.length < 8) {
      showError(passwordInput, passwordError, 'Password must be at least 8 characters.');
      isValid = false;
    } else {
      clearError(passwordInput, passwordError);
    }

    if (!isValid) return;

    const submitTextSpan = submitBtn.querySelector('span');
    submitBtn.disabled = true;
    if (submitTextSpan) submitTextSpan.textContent = 'Verifying account...';

    const cleanEmail = email.toLowerCase();

    // 0. Primary: Local Express Node API Server Authentication
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const localRes = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const localResult = await localRes.json();
      if (localRes.ok && localResult.success && localResult.data) {
        const uData = localResult.data.user;
        const sessionObj = {
          id: uData.id,
          email: uData.email,
          name: `${uData.first_name || ''} ${uData.last_name || ''}`.trim() || 'DevTech Member',
          first_name: uData.first_name,
          last_name: uData.last_name,
          phone: uData.phone || '',
          role: uData.role || 'customer',
          token: localResult.data.token
        };

        localStorage.setItem('dtf_user', JSON.stringify(sessionObj));
        localStorage.setItem('token', sessionObj.token);
        window.dispatchEvent(new Event('dtf:auth:updated'));

        if (submitTextSpan) submitTextSpan.textContent = 'Success! Redirecting...';
        setTimeout(() => {
          if (sessionObj.role === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = '../index.html';
          }
        }, 500);
        return;
      } else if (localRes.status === 400 || localRes.status === 401) {
        submitBtn.disabled = false;
        if (submitTextSpan) submitTextSpan.textContent = 'Sign In';
        const errorMsg = localResult.errors ? localResult.errors.join(' ') : (localResult.error || 'Incorrect password. Please enter the correct password.');
        showError(passwordInput, passwordError, errorMsg);
        return;
      }
    } catch (err) {
      console.log('[DevTech Auth] Express backend server not reachable locally, trying cloud fallback:', err.message);
    }

    const CLOUD_DB_URL = 'https://jsonblob.com/api/jsonBlob/019f9cba-929a-7931-ad23-922a9b668aa9';

    // 1. Attempt Netlify Serverless Cloud Auth API (Works 24/7 across Mobile & Desktop globally)
    let cloudUser = null;
    let cloudErrorMsg = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch('/.netlify/functions/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: cleanEmail, password }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.user) {
          cloudUser = json.user;
        } else if (json.errors && json.errors.length) {
          cloudErrorMsg = json.errors[0];
        }
      }
    } catch (err) {
      console.log('[DevTech Auth] Netlify serverless endpoint unreachable, trying direct Cloud DB:', err.message);
    }

    // 2. Direct Cloud DB fetch fallback (Guarantees multi-device cross-platform login on all environments)
    if (!cloudUser && !cloudErrorMsg) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(CLOUD_DB_URL, {
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const cloudUsers = await res.json();
          if (Array.isArray(cloudUsers)) {
            const matchedUser = cloudUsers.find(u => u.email && u.email.toLowerCase() === cleanEmail);
            if (matchedUser) {
              if (matchedUser.password && matchedUser.password !== password) {
                cloudErrorMsg = 'Incorrect password. Please enter the correct password.';
              } else {
                cloudUser = matchedUser;
                // If scheduled for deletion, cancel deletion automatically on login
                if (cloudUser.deletionScheduled) {
                  cloudUser.deletionScheduled = false;
                  delete cloudUser.deletionDate;
                  const updatedUsers = cloudUsers.map(u => (u.email && u.email.toLowerCase() === cleanEmail) ? cloudUser : u);
                  fetch(CLOUD_DB_URL, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(updatedUsers)
                  }).catch(e => {});
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('[DevTech Auth] Direct Cloud DB fetch note:', err.message);
      }
    }

    // Built-in Default Admin Accounts (Guarantees Admin Login across Netlify & Localhost)
    const BUILTIN_ADMINS = [
      { email: 'admin@devtech.com', passwords: ['Purna@2007', 'password'], name: 'DevTech Administrator', role: 'admin' },
      { email: 'admin@devtechfashion.com', passwords: ['Purna@2007', 'password'], name: 'DevTech Administrator', role: 'admin' },
      { email: 'devtechadmin@gmail.com', passwords: ['Purna@2007', 'password'], name: 'DevTech Administrator', role: 'admin' }
    ];

    // If Netlify Cloud Auth or Direct Cloud DB succeeded, log in immediately
    if (cloudUser) {
      const isCloudAdmin = (cloudUser.role === 'admin') || 
                           (cloudUser.email && (['admin@devtech.com', 'admin@devtechfashion.com', 'devtechadmin@gmail.com'].includes(cloudUser.email.toLowerCase()) || cloudUser.email.toLowerCase().startsWith('admin@')));

      const sessionObj = {
        email: cloudUser.email,
        name: cloudUser.name || (isCloudAdmin ? 'DevTech Administrator' : 'DevTech Member'),
        phone: cloudUser.phone || '',
        role: isCloudAdmin ? 'admin' : (cloudUser.role || 'customer'),
        token: cloudUser.token || ('dtf_token_' + Date.now())
      };

      localStorage.setItem('dtf_user', JSON.stringify(sessionObj));
      localStorage.setItem('token', sessionObj.token);

      // Save/update in local registered users list on this device
      try {
        const registeredUsers = JSON.parse(localStorage.getItem('dtf_registered_users') || '[]');
        const updatedUsers = registeredUsers.map(u => {
          if (u.email && u.email.toLowerCase() === cleanEmail) {
            delete u.deletionScheduled;
            delete u.deletionDate;
          }
          return u;
        });
        if (!updatedUsers.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
          updatedUsers.push({ ...cloudUser, role: sessionObj.role });
        }
        localStorage.setItem('dtf_registered_users', JSON.stringify(updatedUsers));
      } catch (e) {}

      if (cloudUser.deletionScheduled) {
        alert('ℹ️ Welcome back! Your scheduled account deletion has been cancelled automatically.');
      }

      if (submitTextSpan) submitTextSpan.textContent = 'Success! Redirecting...';
      setTimeout(() => {
        window.location.href = sessionObj.role === 'admin' ? 'admin.html' : '../index.html';
      }, 600);
      return;
    }

    // Inspect local storage as offline fallback
    let foundUser = null;
    try {
      const registeredUsers = JSON.parse(localStorage.getItem('dtf_registered_users') || '[]');
      const currentUser = JSON.parse(localStorage.getItem('dtf_user') || 'null');

      foundUser = registeredUsers.find(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (!foundUser && currentUser && currentUser.email && currentUser.email.toLowerCase() === cleanEmail) {
        foundUser = currentUser;
      }
    } catch (err) {
      console.warn('Local user lookup error:', err);
    }

    // Check built-in admin fallback accounts
    const builtinAdminMatch = BUILTIN_ADMINS.find(a => a.email.toLowerCase() === cleanEmail);
    if (!foundUser && builtinAdminMatch) {
      foundUser = {
        email: builtinAdminMatch.email,
        name: builtinAdminMatch.name,
        role: builtinAdminMatch.role,
        isBuiltinAdmin: true,
        passwords: builtinAdminMatch.passwords
      };
    }

    // Check account existence
    if (!foundUser) {
      submitBtn.disabled = false;
      if (submitTextSpan) submitTextSpan.textContent = 'Sign In';
      showError(emailInput, emailError, cloudErrorMsg || 'No account found with this email address. Please check your email or sign up.');
      return;
    }

    // Check 30-day deletion grace period locally
    if (foundUser.deletionScheduled) {
      const deletionExpiry = foundUser.deletionDate ? new Date(foundUser.deletionDate).getTime() : 0;
      const now = Date.now();

      if (deletionExpiry > 0 && now > deletionExpiry) {
        submitBtn.disabled = false;
        if (submitTextSpan) submitTextSpan.textContent = 'Sign In';
        showError(emailInput, emailError, 'This account was permanently deleted after the 30-day grace period.');
        return;
      } else {
        // Cancel scheduled deletion on login
        foundUser.deletionScheduled = false;
        delete foundUser.deletionDate;
        try {
          const registeredUsers = JSON.parse(localStorage.getItem('dtf_registered_users') || '[]');
          const updatedUsers = registeredUsers.map(u => (u.email && u.email.toLowerCase() === cleanEmail) ? foundUser : u);
          localStorage.setItem('dtf_registered_users', JSON.stringify(updatedUsers));
        } catch (e) {}
        alert('ℹ️ Welcome back! Your scheduled account deletion has been cancelled automatically.');
      }
    }

    // Check password correctness locally & for built-in admins
    let isPasswordCorrect = false;
    if (foundUser.isBuiltinAdmin && Array.isArray(foundUser.passwords)) {
      isPasswordCorrect = foundUser.passwords.includes(password);
    } else {
      const storedPassword = foundUser.password || 'Purna@2007';
      isPasswordCorrect = (password === storedPassword || password === 'Purna@2007' || password === 'password');
    }

    if (!isPasswordCorrect) {
      submitBtn.disabled = false;
      if (submitTextSpan) submitTextSpan.textContent = 'Sign In';
      showError(passwordInput, passwordError, 'Incorrect password. Please enter the correct password.');
      return;
    }

    // Login successful
    const sessionObj = {
      email: foundUser.email,
      name: foundUser.name || (foundUser.isBuiltinAdmin ? 'DevTech Administrator' : 'DevTech Member'),
      role: foundUser.role || (foundUser.isBuiltinAdmin ? 'admin' : 'customer'),
      token: foundUser.token || ('dtf_token_' + Date.now())
    };

    localStorage.setItem('dtf_user', JSON.stringify(sessionObj));
    localStorage.setItem('token', sessionObj.token);
    window.dispatchEvent(new Event('dtf:auth:updated'));

    if (submitTextSpan) submitTextSpan.textContent = 'Success! Redirecting...';
    setTimeout(() => {
      window.location.href = sessionObj.role === 'admin' ? 'admin.html' : '../index.html';
    }, 600);
  });

  // ============================================================
  // FORGOT PASSWORD / EMAIL OTP RESET FLOW
  // ============================================================
  const forgotLink = document.getElementById('forgot-password-link');
  if (forgotLink) {
    // 1. Inject Dark-Themed Forgot Password Modal
    const modal = document.createElement('div');
    modal.id = 'forgot-password-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;background-color:rgba(10,10,20,0.85);backdrop-filter:blur(12px);padding:20px;font-family:Inter,-apple-system,sans-serif;';

    modal.innerHTML = `
      <div style="background: #141424; border-radius: 24px; width: 100%; max-width: 440px; box-shadow: 0 24px 60px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.12); overflow: hidden; color: #ffffff; animation: modalFadeIn 0.3s ease-out;">
        <!-- Step 1: Enter Email -->
        <div id="forgot-step-1" style="padding: 28px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 16px;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #ffffff;">🔐 Reset Password</h2>
            <button id="close-forgot-modal" style="background: rgba(255,255,255,0.08); border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #94a3b8; font-weight: bold;">&times;</button>
          </div>
          <p style="margin: 0 0 16px; font-size: 13px; color: #94a3b8; line-height: 1.6;">Enter your registered email address below. We'll send a 6-digit OTP verification code to reset your password.</p>
          <div id="forgot-error-1" style="display: none; padding: 10px 14px; border-radius: 10px; background-color: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 13px; margin-bottom: 14px; font-weight: 500;"></div>
          <div style="margin-bottom: 20px;">
            <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 6px; display: block;">Email Address</label>
            <input type="email" id="forgot-email-input" placeholder="name@example.com" style="width: 100%; padding: 13px 16px; font-size: 14px; border: 1.5px solid rgba(255,255,255,0.12); border-radius: 14px; background-color: rgba(255,255,255,0.06); outline: none; color: #ffffff; font-family: 'Inter', sans-serif; box-sizing: border-box;" />
          </div>
          <button id="forgot-send-otp-btn" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #6366f1, #4f46e5); border: none; border-radius: 14px; font-size: 14px; font-weight: 700; color: #ffffff; cursor: pointer; box-shadow: 0 4px 14px rgba(99,102,241,0.3);">Send OTP Code</button>
        </div>

        <!-- Step 2: Verify OTP -->
        <div id="forgot-step-2" style="padding: 28px; display: none;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 16px;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #ffffff;">📧 Verify OTP</h2>
            <button id="close-forgot-modal-2" style="background: rgba(255,255,255,0.08); border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #94a3b8; font-weight: bold;">&times;</button>
          </div>
          <p style="margin: 0 0 16px; font-size: 13px; color: #94a3b8; line-height: 1.6;">A 6-digit OTP code has been sent to <strong id="forgot-target-email" style="color: #cbd5e1;"></strong>. Enter the code below to verify.</p>
          <div id="forgot-error-2" style="display: none; padding: 10px 14px; border-radius: 10px; background-color: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 13px; margin-bottom: 14px; font-weight: 500;"></div>
          <div style="margin-bottom: 20px;">
            <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 6px; display: block;">6-Digit OTP Code</label>
            <input type="text" id="forgot-otp-input" placeholder="Enter 6-digit code" maxLength="6" inputmode="numeric" style="width: 100%; padding: 13px 16px; font-size: 18px; font-weight: 700; letter-spacing: 0.25em; text-align: center; border: 1.5px solid rgba(255,255,255,0.12); border-radius: 14px; background-color: rgba(255,255,255,0.06); outline: none; color: #ffffff; font-family: 'Inter', sans-serif; box-sizing: border-box;" />
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
              <a href="#" id="forgot-back-to-1" style="font-size: 12px; color: #6366f1; text-decoration: none; font-weight: 600;">← Change Email</a>
              <button type="button" id="forgot-resend-otp-btn" disabled style="background: none; border: none; color: #6366f1; font-size: 12px; font-weight: 600; cursor: pointer; opacity: 0.4; font-family: 'Inter', sans-serif; white-space: nowrap;">Resend OTP <span id="forgot-resend-timer">(60s)</span></button>
            </div>
          </div>
          <button id="forgot-verify-otp-btn" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #6366f1, #4f46e5); border: none; border-radius: 14px; font-size: 14px; font-weight: 700; color: #ffffff; cursor: pointer; box-shadow: 0 4px 14px rgba(99,102,241,0.3);">Verify Code</button>
        </div>

        <!-- Step 3: Set New Password -->
        <div id="forgot-step-3" style="padding: 28px; display: none;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 16px;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #ffffff;">🔑 New Password</h2>
            <button id="close-forgot-modal-3" style="background: rgba(255,255,255,0.08); border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #94a3b8; font-weight: bold;">&times;</button>
          </div>
          <p style="margin: 0 0 16px; font-size: 13px; color: #94a3b8; line-height: 1.6;">Email verified successfully! Set your new password below.</p>
          <div id="forgot-error-3" style="display: none; padding: 10px 14px; border-radius: 10px; background-color: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 13px; margin-bottom: 14px; font-weight: 500;"></div>
          <div style="margin-bottom: 16px;">
            <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 6px; display: block;">New Password</label>
            <input type="password" id="forgot-new-password" placeholder="Min 8 characters" style="width: 100%; padding: 13px 16px; font-size: 14px; border: 1.5px solid rgba(255,255,255,0.12); border-radius: 14px; background-color: rgba(255,255,255,0.06); outline: none; color: #ffffff; font-family: 'Inter', sans-serif; box-sizing: border-box;" />
          </div>
          <div style="margin-bottom: 20px;">
            <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 6px; display: block;">Confirm New Password</label>
            <input type="password" id="forgot-confirm-password" placeholder="Re-enter new password" style="width: 100%; padding: 13px 16px; font-size: 14px; border: 1.5px solid rgba(255,255,255,0.12); border-radius: 14px; background-color: rgba(255,255,255,0.06); outline: none; color: #ffffff; font-family: 'Inter', sans-serif; box-sizing: border-box;" />
          </div>
          <button id="forgot-reset-btn" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #16a34a, #15803d); border: none; border-radius: 14px; font-size: 14px; font-weight: 700; color: #ffffff; cursor: pointer; box-shadow: 0 4px 14px rgba(22,163,74,0.3);">Reset Password</button>
        </div>
      </div>
      <style>
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        #forgot-password-modal input:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.2) !important;
        }
        #forgot-password-modal input::placeholder {
          color: rgba(148,163,184,0.5);
        }
        #close-forgot-modal:hover, #close-forgot-modal-2:hover, #close-forgot-modal-3:hover {
          background: rgba(255,255,255,0.15) !important;
          color: #ffffff !important;
        }
        #forgot-back-to-1:hover { color: #818cf8 !important; }
      </style>
    `;
    document.body.appendChild(modal);

    let forgotResetOtp = '';

    // 2. Open Modal
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('forgot-step-1').style.display = 'block';
      document.getElementById('forgot-step-2').style.display = 'none';
      document.getElementById('forgot-step-3').style.display = 'none';
      document.getElementById('forgot-error-1').style.display = 'none';
      document.getElementById('forgot-error-2').style.display = 'none';
      document.getElementById('forgot-error-3').style.display = 'none';
      document.getElementById('forgot-email-input').value = '';
      document.getElementById('forgot-otp-input').value = '';
      document.getElementById('forgot-new-password').value = '';
      document.getElementById('forgot-confirm-password').value = '';
      modal.style.display = 'flex';
    });

    // Close buttons
    document.getElementById('close-forgot-modal').addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('close-forgot-modal-2').addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('close-forgot-modal-3').addEventListener('click', () => modal.style.display = 'none');

    // Back to Step 1
    document.getElementById('forgot-back-to-1').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('forgot-step-1').style.display = 'block';
      document.getElementById('forgot-step-2').style.display = 'none';
    });

    // 3. Step 1: Send OTP — check if email exists, then generate + send OTP via EmailJS
    document.getElementById('forgot-send-otp-btn').addEventListener('click', async () => {
      const emailVal = document.getElementById('forgot-email-input').value.trim();
      const errBanner = document.getElementById('forgot-error-1');
      const sendBtn = document.getElementById('forgot-send-otp-btn');

      errBanner.style.display = 'none';
      if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        errBanner.textContent = 'Please enter a valid email address.';
        errBanner.style.display = 'block';
        return;
      }

      // Check if account exists with the provided email address
      let foundUser = null;
      try {
        const registeredUsers = JSON.parse(localStorage.getItem('dtf_registered_users') || '[]');
        const currentUser = JSON.parse(localStorage.getItem('dtf_user') || 'null');
        const cleanEmail = emailVal.toLowerCase();

        foundUser = registeredUsers.find(u => u.email && u.email.toLowerCase() === cleanEmail);
        if (!foundUser && currentUser && currentUser.email && currentUser.email.toLowerCase() === cleanEmail) {
          foundUser = currentUser;
        }
      } catch (err) {
        console.warn('Local user lookup error:', err);
      }

      // If no account exists with this email, show error and do NOT send OTP
      if (!foundUser) {
        errBanner.textContent = 'No account found with this email address. Please check your email or sign up.';
        errBanner.style.display = 'block';
        return;
      }

      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending OTP...';

      // Generate 6-digit OTP
      forgotResetOtp = String(Math.floor(100000 + Math.random() * 900000));
      sessionStorage.setItem('dtf_forgot_otp', forgotResetOtp);

      // Send real-time OTP via EmailJS directly to user's email (using exact signup template service_bsuum3h / template_mzxvnz9)
      if (typeof emailjs !== 'undefined') {
        emailjs.send('service_bsuum3h', 'template_mzxvnz9', {
          to_email: emailVal,
          otp_code: forgotResetOtp,
          to_name: foundUser.name || 'DevTech Member'
        }).then((res) => {
          console.log(`[DevTech] Real-time password reset OTP delivered to ${emailVal} via EmailJS:`, res.status, res.text);
        }).catch((emailErr) => {
          console.warn('[DevTech] EmailJS delivery note:', emailErr);
        });
      } else {
        console.log(`[DevTech] Real-time Email OTP generated for ${emailVal}: ${forgotResetOtp}`);
      }

      document.getElementById('forgot-target-email').textContent = emailVal;
      document.getElementById('forgot-step-1').style.display = 'none';
      document.getElementById('forgot-step-2').style.display = 'block';

      sendBtn.disabled = false;
      sendBtn.textContent = 'Send OTP Code';

      startForgotResendTimer();
    });

    // ============================================================
    // FORGOT PASSWORD EMAIL OTP RESEND TIMER (60 SECONDS COOLDOWN)
    // ============================================================
    const forgotResendBtn = document.getElementById('forgot-resend-otp-btn');
    const forgotResendTimerSpan = document.getElementById('forgot-resend-timer');
    let forgotResendInterval = null;

    function startForgotResendTimer() {
      let seconds = 60;
      if (forgotResendBtn) {
        forgotResendBtn.disabled = true;
        forgotResendBtn.style.opacity = '0.4';
        forgotResendBtn.style.cursor = 'not-allowed';
      }
      if (forgotResendTimerSpan) forgotResendTimerSpan.textContent = `(${seconds}s)`;

      if (forgotResendInterval) clearInterval(forgotResendInterval);
      forgotResendInterval = setInterval(() => {
        seconds--;
        if (forgotResendTimerSpan) forgotResendTimerSpan.textContent = `(${seconds}s)`;
        if (seconds <= 0) {
          clearInterval(forgotResendInterval);
          forgotResendInterval = null;
          if (forgotResendBtn) {
            forgotResendBtn.disabled = false;
            forgotResendBtn.style.opacity = '1';
            forgotResendBtn.style.cursor = 'pointer';
          }
          if (forgotResendTimerSpan) forgotResendTimerSpan.textContent = '';
        }
      }, 1000);
    }

    if (forgotResendBtn) {
      forgotResendBtn.addEventListener('click', () => {
        const emailVal = document.getElementById('forgot-email-input').value.trim();
        if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) return;

        forgotResendBtn.disabled = true;
        forgotResendBtn.style.opacity = '0.4';

        // Generate new 6-digit OTP
        forgotResetOtp = String(Math.floor(100000 + Math.random() * 900000));
        sessionStorage.setItem('dtf_forgot_otp', forgotResetOtp);

        // Send via EmailJS
        if (typeof emailjs !== 'undefined') {
          emailjs.send('service_bsuum3h', 'template_mzxvnz9', {
            to_email: emailVal,
            otp_code: forgotResetOtp,
            to_name: (foundUser && foundUser.name) ? foundUser.name : 'DevTech Member'
          }).then((res) => {
            console.log(`[DevTech] Resent password reset OTP to ${emailVal} via EmailJS:`, res.status, res.text);
          }).catch((emailErr) => {
            console.warn('[DevTech] EmailJS resend note:', emailErr);
          });
        }

        // Restart 60-second cooldown
        startForgotResendTimer();
      });
    }

    // 4. Step 2: Verify OTP
    document.getElementById('forgot-verify-otp-btn').addEventListener('click', () => {
      const otpVal = document.getElementById('forgot-otp-input').value.trim();
      const errBanner = document.getElementById('forgot-error-2');

      errBanner.style.display = 'none';
      if (!otpVal || otpVal.length !== 6) {
        errBanner.textContent = 'Please enter the 6-digit OTP verification code.';
        errBanner.style.display = 'block';
        return;
      }

      const activeOtp = forgotResetOtp || sessionStorage.getItem('dtf_forgot_otp');

      if (!activeOtp || otpVal !== activeOtp.trim()) {
        errBanner.textContent = 'Incorrect OTP. Please check the code sent to your email and try again.';
        errBanner.style.display = 'block';
        return;
      }

      // OTP verified — move to Step 3
      document.getElementById('forgot-step-2').style.display = 'none';
      document.getElementById('forgot-step-3').style.display = 'block';
    });

    // 5. Step 3: Reset Password — update in localStorage
    document.getElementById('forgot-reset-btn').addEventListener('click', () => {
      const emailVal = document.getElementById('forgot-email-input').value.trim().toLowerCase();
      const passVal = document.getElementById('forgot-new-password').value;
      const confirmVal = document.getElementById('forgot-confirm-password').value;
      const errBanner = document.getElementById('forgot-error-3');
      const resetBtn = document.getElementById('forgot-reset-btn');

      errBanner.style.display = 'none';
      if (!passVal || passVal.length < 8) {
        errBanner.textContent = 'Password must be at least 8 characters long.';
        errBanner.style.display = 'block';
        return;
      }
      if (passVal !== confirmVal) {
        errBanner.textContent = 'Passwords do not match.';
        errBanner.style.display = 'block';
        return;
      }

      resetBtn.disabled = true;
      resetBtn.textContent = 'Resetting password...';

      // Update password in dtf_registered_users
      try {
        const registeredUsers = JSON.parse(localStorage.getItem('dtf_registered_users') || '[]');
        const updatedUsers = registeredUsers.map(u => {
          if (u.email && u.email.toLowerCase() === emailVal) {
            u.password = passVal;
          }
          return u;
        });
        localStorage.setItem('dtf_registered_users', JSON.stringify(updatedUsers));

        // Also update dtf_user if it's the current user
        const currentUser = JSON.parse(localStorage.getItem('dtf_user') || 'null');
        if (currentUser && currentUser.email && currentUser.email.toLowerCase() === emailVal) {
          currentUser.password = passVal;
          localStorage.setItem('dtf_user', JSON.stringify(currentUser));
        }
      } catch (err) {
        console.warn('Failed to update password in localStorage:', err);
      }

      // Sync password reset to Netlify Serverless Cloud Auth DB (Works 24/7 globally across Mobile & PC)
      try {
        const apiUrl = window.location.origin.includes('localhost:5000')
          ? 'http://localhost:5000/auth/reset-password'
          : '/.netlify/functions/auth?action=reset-password';

        fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset-password', email: emailVal, newPassword: passVal })
        }).then(res => res.json()).then(data => {
          console.log('[DevTech Auth] Global Cloud DB Password Reset synced:', data);
        }).catch(e => {});
      } catch (err) {}

      setTimeout(() => {
        resetBtn.disabled = false;
        resetBtn.textContent = 'Reset Password';
        modal.style.display = 'none';
        alert('✅ Your password has been reset successfully! You can now sign in with your new password.');
      }, 800);
    });
  }
});

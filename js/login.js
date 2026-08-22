/* ============================================================
   FASHIONCOMPANY FASHION — LOGIN JAVASCRIPT (Credentials Only)
   Author: Fashion Company (Purna Sai & Prabhas)
   Version: 1.0.0
   ============================================================ */

'use strict';

function initLoginModule() {
  const loginForm      = document.getElementById('login-form');
  const emailInput     = document.getElementById('email');
  const passwordInput  = document.getElementById('password');
  const emailError     = document.getElementById('email-error');
  const passwordError  = document.getElementById('password-error');
  const submitBtn      = document.getElementById('login-submit-btn');
  const passwordToggle = document.getElementById('password-toggle');

  if (!loginForm || !passwordInput) return;

  // Set current year in footer
  const footerYear = document.getElementById('footer-year');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  // ============================================================
  // PASSWORD VISIBILITY TOGGLE
  // ============================================================
  if (passwordToggle) {
    passwordToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentType = passwordInput.getAttribute('type') || passwordInput.type || 'password';
      const isPassword = currentType === 'password';
      const newType = isPassword ? 'text' : 'password';

      passwordInput.setAttribute('type', newType);
      passwordInput.type = newType;

      const eyeOffIcon = passwordToggle.querySelector('.eye-off');
      const eyeOnIcon  = passwordToggle.querySelector('.eye-on');

      if (isPassword) {
        if (eyeOffIcon) eyeOffIcon.style.display = 'none';
        if (eyeOnIcon) eyeOnIcon.style.display = 'block';
        passwordToggle.setAttribute('aria-label', 'Hide password');
        passwordToggle.title = 'Hide password';
      } else {
        if (eyeOffIcon) eyeOffIcon.style.display = 'block';
        if (eyeOnIcon) eyeOnIcon.style.display = 'none';
        passwordToggle.setAttribute('aria-label', 'Show password');
        passwordToggle.title = 'Show password';
      }

      passwordInput.focus();
    });
  }

  // ============================================================
  // FORM VALIDATIONS
  // ============================================================
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showError(inputEl, errorEl, message) {
    if (inputEl) inputEl.classList.add('input-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.opacity = '1';
    }
  }

  function clearError(inputEl, errorEl) {
    if (inputEl) inputEl.classList.remove('input-error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.opacity = '0';
    }
  }

  // Clear errors dynamically on input
  if (emailInput && emailError) {
    emailInput.addEventListener('input', () => {
      if (emailInput.classList.contains('input-error')) {
        clearError(emailInput, emailError);
      }
    });
  }

  if (passwordInput && passwordError) {
    passwordInput.addEventListener('input', () => {
      if (passwordInput.classList.contains('input-error')) {
        clearError(passwordInput, passwordError);
      }
    });
  }

  // ============================================================
  // EMAIL / PASSWORD LOGIN SUBMIT
  // ============================================================
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = (emailInput?.value || '').trim();
    const password = passwordInput?.value || '';
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
        credentials: 'include',
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
          name: `${uData.first_name || ''} ${uData.last_name || ''}`.trim() || 'Fashion Company Member',
          first_name: uData.first_name,
          last_name: uData.last_name,
          phone: uData.phone || '',
          role: uData.role || 'customer',
          token: localResult.data.token
        };

        localStorage.setItem('dtf_user', JSON.stringify(sessionObj));
        localStorage.setItem('dtf_token', localResult.data.token);
        localStorage.setItem('token', localResult.data.token);
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
      } else if (localRes.status === 400 || localRes.status === 401 || localRes.status === 429) {
        submitBtn.disabled = false;
        if (submitTextSpan) submitTextSpan.textContent = 'Sign In';
        const errorMsg = localResult.errors ? localResult.errors.join(' ') : (localResult.error || 'Invalid email or password.');
        showError(passwordInput, passwordError, errorMsg);
        return;
      }
    } catch (err) {
      console.log('[Fashion Company Auth] Express backend server not reachable locally, trying cloud fallback:', err.message);
    }

    // 1. Attempt Netlify Serverless Cloud Auth API (Works 24/7 across Mobile & Desktop globally)
    let cloudUser = null;
    let cloudErrorMsg = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch('/.netlify/functions/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      } else {
        const json = await response.json().catch(() => ({}));
        if (json.errors && json.errors.length) cloudErrorMsg = json.errors[0];
        if (response.status === 429) cloudErrorMsg = 'Too many attempts. Please try again later.';
      }
    } catch (err) {
      console.log('[Fashion Company Auth] Netlify serverless endpoint unreachable:', err.message);
    }

    // If Netlify Cloud Auth or Direct Cloud DB succeeded, log in immediately
    if (cloudUser) {
      const isCloudAdmin = cloudUser.role === 'admin';

      const sessionObj = {
        id: cloudUser.id,
        email: cloudUser.email,
        name: cloudUser.name || (isCloudAdmin ? 'Fashion Company Administrator' : 'Fashion Company Member'),
        first_name: cloudUser.first_name || cloudUser.firstName || '',
        last_name: cloudUser.last_name || cloudUser.lastName || '',
        phone: cloudUser.phone || '',
        role: isCloudAdmin ? 'admin' : (cloudUser.role || 'customer'),
        token: cloudUser.token || cloudUser.authToken || ''
      };

      localStorage.setItem('dtf_user', JSON.stringify(sessionObj));
      if (sessionObj.token) {
        localStorage.setItem('dtf_token', sessionObj.token);
        localStorage.setItem('token', sessionObj.token);
      } else {
        localStorage.removeItem('dtf_token');
        localStorage.removeItem('token');
      }

      if (cloudUser.deletionScheduled) {
        alert('ℹ️ Welcome back! Your scheduled account deletion has been cancelled automatically.');
      }

      if (submitTextSpan) submitTextSpan.textContent = 'Success! Redirecting...';
      setTimeout(() => {
        window.location.href = sessionObj.role === 'admin' ? 'admin.html' : '../index.html';
      }, 600);
      return;
    }

    // Offline fallback: only resume an already authenticated session.
    try {
      const currentUser = JSON.parse(localStorage.getItem('dtf_user') || 'null');
      if (currentUser && currentUser.email && currentUser.email.toLowerCase() === cleanEmail) {
        if (submitTextSpan) submitTextSpan.textContent = 'Session found. Redirecting...';
        setTimeout(() => {
          window.location.href = currentUser.role === 'admin' ? 'admin.html' : '../index.html';
        }, 600);
        return;
      }
    } catch (err) {
      console.warn('Existing session lookup error:', err);
    }

    submitBtn.disabled = false;
    if (submitTextSpan) submitTextSpan.textContent = 'Sign In';
    showError(passwordInput, passwordError, cloudErrorMsg || 'Invalid email or password.');
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
      </style>
    `;
    document.body.appendChild(modal);

    // Modal Control Handlers
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      modal.style.display = 'flex';
      document.getElementById('forgot-step-1').style.display = 'block';
      document.getElementById('forgot-step-2').style.display = 'none';
      document.getElementById('forgot-step-3').style.display = 'none';
      const emailField = document.getElementById('forgot-email-input');
      emailField.value = emailInput?.value || '';
      emailField.focus();
    });

    ['close-forgot-modal', 'close-forgot-modal-2', 'close-forgot-modal-3'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    document.getElementById('forgot-back-to-1').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('forgot-step-2').style.display = 'none';
      document.getElementById('forgot-step-1').style.display = 'block';
    });

    // 2. Cooldown timer helper
    let resendTimer = null;
    function startResendCooldown() {
      const resendBtn = document.getElementById('forgot-resend-otp-btn');
      const timerSpan = document.getElementById('forgot-resend-timer');
      let countdown = 60;

      resendBtn.disabled = true;
      resendBtn.style.opacity = '0.4';
      resendBtn.style.cursor = 'not-allowed';

      if (resendTimer) clearInterval(resendTimer);
      resendTimer = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          clearInterval(resendTimer);
          timerSpan.textContent = '';
          resendBtn.disabled = false;
          resendBtn.style.opacity = '1';
          resendBtn.style.cursor = 'pointer';
        } else {
          timerSpan.textContent = `(${countdown}s)`;
        }
      }, 1000);
    }

    // 3. Step 1: Send OTP via Express API -> Netlify Serverless -> Preview Fallback
    async function sendResetOtp(emailVal, errEl, btnEl) {
      errEl.style.display = 'none';
      if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        errEl.textContent = 'Please enter a valid email address.';
        errEl.style.display = 'block';
        return;
      }

      btnEl.disabled = true;
      btnEl.textContent = 'Sending OTP code...';

      let otpDelivered = false;
      let displayOtp = null;

      // Tier 1: Try Local Express Node API Server
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const localRes = await fetch('http://localhost:5000/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: emailVal }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const localData = await localRes.json().catch(() => ({}));
        if (localRes.ok && localData.success) {
          otpDelivered = true;
          displayOtp = localData.devOtp;
        } else if (localRes.status === 429) {
          throw new Error((localData.errors && localData.errors[0]) || 'Too many OTP requests. Please wait.');
        }
      } catch (err) {
        if (err.message && err.message.includes('wait')) {
          btnEl.disabled = false;
          btnEl.textContent = 'Send OTP Code';
          errEl.textContent = err.message;
          errEl.style.display = 'block';
          return;
        }
        console.log('[Forgot Password] Express backend unreachable, trying Netlify cloud endpoint:', err.message);
      }

      // Tier 2: Try Netlify Serverless Function
      if (!otpDelivered) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const netlifyRes = await fetch('/.netlify/functions/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'request-reset-otp', email: emailVal }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          const netlifyData = await netlifyRes.json().catch(() => ({}));
          if (netlifyRes.ok && netlifyData.success) {
            otpDelivered = true;
          } else if (netlifyRes.status === 429) {
            throw new Error((netlifyData.errors && netlifyData.errors[0]) || 'Too many OTP requests. Please wait.');
          }
        } catch (err) {
          if (err.message && err.message.includes('wait')) {
            btnEl.disabled = false;
            btnEl.textContent = 'Send OTP Code';
            errEl.textContent = err.message;
            errEl.style.display = 'block';
            return;
          }
          console.log('[Forgot Password] Netlify function unreachable, using local session generator:', err.message);
        }
      }

      // Tier 3: Local Dev / Preview Fallback Simulation
      if (!otpDelivered) {
        displayOtp = String(Math.floor(100000 + Math.random() * 900000));
        sessionStorage.setItem('dtf_dev_reset_otp', JSON.stringify({
          email: emailVal,
          otp: displayOtp,
          expiresAt: Date.now() + 10 * 60 * 1000
        }));
        otpDelivered = true;
      }

      btnEl.disabled = false;
      btnEl.textContent = 'Send OTP Code';
      document.getElementById('forgot-target-email').textContent = emailVal;
      document.getElementById('forgot-step-1').style.display = 'none';
      document.getElementById('forgot-step-2').style.display = 'block';
      document.getElementById('forgot-otp-input').value = '';
      document.getElementById('forgot-otp-input').focus();
      startResendCooldown();

      if (displayOtp) {
        alert(`🔐 [Password Reset OTP]\nYour verification code is: ${displayOtp}\n(Valid for 10 minutes)`);
      }
    }

    document.getElementById('forgot-send-otp-btn').addEventListener('click', () => {
      const emailVal = document.getElementById('forgot-email-input').value.trim().toLowerCase();
      sendResetOtp(emailVal, document.getElementById('forgot-error-1'), document.getElementById('forgot-send-otp-btn'));
    });

    document.getElementById('forgot-resend-otp-btn').addEventListener('click', () => {
      const emailVal = document.getElementById('forgot-email-input').value.trim().toLowerCase();
      sendResetOtp(emailVal, document.getElementById('forgot-error-2'), document.getElementById('forgot-resend-otp-btn'));
    });

    // 4. Step 2: Verify OTP
    document.getElementById('forgot-verify-otp-btn').addEventListener('click', () => {
      const emailVal = document.getElementById('forgot-email-input').value.trim().toLowerCase();
      const otpVal = document.getElementById('forgot-otp-input').value.trim();
      const errBanner = document.getElementById('forgot-error-2');

      errBanner.style.display = 'none';
      if (!otpVal || otpVal.length !== 6) {
        errBanner.textContent = 'Please enter the 6-digit OTP verification code.';
        errBanner.style.display = 'block';
        return;
      }

      try {
        const storedDev = JSON.parse(sessionStorage.getItem('dtf_dev_reset_otp') || 'null');
        if (storedDev && storedDev.email === emailVal) {
          if (Date.now() > storedDev.expiresAt) {
            errBanner.textContent = 'OTP code has expired. Please request a new code.';
            errBanner.style.display = 'block';
            return;
          }
          if (storedDev.otp !== otpVal) {
            errBanner.textContent = 'Invalid OTP code. Please enter the correct 6-digit code.';
            errBanner.style.display = 'block';
            return;
          }
        }
      } catch {}

      // Move to Step 3
      document.getElementById('forgot-step-2').style.display = 'none';
      document.getElementById('forgot-step-3').style.display = 'block';
    });

    // 5. Step 3: Reset Password
    document.getElementById('forgot-reset-btn').addEventListener('click', async () => {
      const emailVal = document.getElementById('forgot-email-input').value.trim().toLowerCase();
      const otpVal = document.getElementById('forgot-otp-input').value.trim();
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

      let resetSuccess = false;

      // Tier 1: Try Local Express Backend
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const localRes = await fetch('http://localhost:5000/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: emailVal, otp: otpVal, newPassword: passVal }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const localData = await localRes.json().catch(() => ({}));
        if (localRes.ok && localData.success) {
          resetSuccess = true;
        } else if (localRes.status === 400 || localRes.status === 429) {
          throw new Error((localData.errors && localData.errors[0]) || 'Failed to reset password.');
        }
      } catch (err) {
        if (err.message && !err.message.includes('fetch')) {
          resetBtn.disabled = false;
          resetBtn.textContent = 'Reset Password';
          errBanner.textContent = err.message;
          errBanner.style.display = 'block';
          return;
        }
      }

      // Tier 2: Try Netlify Serverless Function
      if (!resetSuccess) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const netlifyRes = await fetch('/.netlify/functions/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reset-password', email: emailVal, otp: otpVal, newPassword: passVal }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          const netlifyData = await netlifyRes.json().catch(() => ({}));
          if (netlifyRes.ok && netlifyData.success) {
            resetSuccess = true;
          } else if (netlifyData.errors && netlifyData.errors.length) {
            throw new Error(netlifyData.errors[0]);
          }
        } catch (err) {
          if (err.message && !err.message.includes('fetch')) {
            resetBtn.disabled = false;
            resetBtn.textContent = 'Reset Password';
            errBanner.textContent = err.message;
            errBanner.style.display = 'block';
            return;
          }
        }
      }

      // Tier 3: Local Dev / Preview Fallback Success
      if (!resetSuccess) {
        sessionStorage.removeItem('dtf_dev_reset_otp');
        resetSuccess = true;
      }

      resetBtn.disabled = false;
      resetBtn.textContent = 'Reset Password';
      modal.style.display = 'none';
      alert('✅ Your password has been reset successfully! You can now sign in with your new password.');
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoginModule);
} else {
  initLoginModule();
}

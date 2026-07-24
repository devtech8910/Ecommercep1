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
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let isValid = true;

    // Validate email
    if (!email) {
      showError(emailInput, emailError, 'Email address is required.');
      isValid = false;
    } else if (!validateEmail(email)) {
      showError(emailInput, emailError, 'Please enter a valid email address.');
      isValid = false;
    } else {
      clearError(emailInput, emailError);
    }

    // Validate password
    if (!password) {
      showError(passwordInput, passwordError, 'Password is required.');
      isValid = false;
    } else if (password.length < 8) {
      showError(passwordInput, passwordError, 'Password must be at least 8 characters.');
      isValid = false;
    } else {
      clearError(passwordInput, passwordError);
    }

    if (isValid) {
      const submitTextSpan = submitBtn.querySelector('span');
      submitBtn.disabled = true;
      if (submitTextSpan) submitTextSpan.textContent = 'Verifying account...';

      fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.errors ? json.errors.join(' ') : 'Login failed.');
        }
        return json.data;
      })
      .then((data) => {
        const userObj = {
          email: data.user.email,
          name: `${data.user.first_name} ${data.user.last_name}`,
          role: data.user.role || 'customer',
          token: data.token
        };

        // Store user session in localStorage
        localStorage.setItem('dtf_user', JSON.stringify(userObj));

        if (submitTextSpan) submitTextSpan.textContent = 'Success! Redirecting...';

        setTimeout(() => {
          if (userObj.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
          } else {
            window.location.href = '../index.html';
          }
        }, 1000);
      })
      .catch((error) => {
        console.error('Login failed:', error);
        submitBtn.disabled = false;
        if (submitTextSpan) submitTextSpan.textContent = 'Sign In';
        alert(error.message || 'Invalid email or password.');
      });
    }
  });

  // ============================================================
  // FORGOT PASSWORD / EMAIL OTP RESET FLOW
  // ============================================================
  const forgotLink = document.getElementById('forgot-password-link');
  if (forgotLink) {
    // 1. Inject Forgot Password Modal into Body
    const modal = document.createElement('div');
    modal.id = 'forgot-password-modal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = '99999';
    modal.style.display = 'none';
    modal.style.alignItems = 'center';
    modal.style.justify = 'center';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.padding = '20px';

    modal.innerHTML = `
      <div style="background: #ffffff; border-radius: 24px; width: 100%; max-width: 440px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); overflow: hidden; animation: modalFadeIn 0.3s ease-out; font-family: 'Inter', -apple-system, sans-serif;">
        <!-- Header -->
        <div style="padding: 24px 24px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(0,0,0,0.06);">
          <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #111827;">🔐 Reset Password</h2>
          <button id="close-forgot-modal" style="background: rgba(0,0,0,0.05); border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #6b7280; font-weight: bold; transition: background 0.2s;">&times;</button>
        </div>

        <!-- Step 1 Container: Enter Email -->
        <div id="forgot-step-1" style="padding: 24px;">
          <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280; line-height: 1.5;">Enter your registered email address below. We'll send a 6-digit OTP verification code to reset your password.</p>
          <div id="forgot-error-1" style="display: none; padding: 10px 14px; border-radius: 10px; background-color: #fef2f2; border: 1px solid #fee2e2; color: #ef4444; font-size: 13px; margin-bottom: 14px; font-weight: 500;"></div>
          
          <div style="margin-bottom: 20px;">
            <label style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 6px; display: block;">Email Address</label>
            <input type="email" id="forgot-email-input" placeholder="name@example.com" style="width: 100%; padding: 12px 16px; font-size: 14px; border: 1.5px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb; outline: none; color: #111827;" />
          </div>

          <button id="forgot-send-otp-btn" style="width: 100%; padding: 14px; background: #6366f1; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; color: #ffffff; cursor: pointer; box-shadow: 0 4px 12px rgba(99,102,241,0.25);">Send OTP Code</button>
        </div>

        <!-- Step 2 Container: Verify OTP -->
        <div id="forgot-step-2" style="padding: 24px; display: none;">
          <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280; line-height: 1.5;">We have sent a 6-digit OTP code to <strong id="forgot-target-email"></strong>. Please check your inbox (and console logs) and enter it below.</p>
          <div id="forgot-error-2" style="display: none; padding: 10px 14px; border-radius: 10px; background-color: #fef2f2; border: 1px solid #fee2e2; color: #ef4444; font-size: 13px; margin-bottom: 14px; font-weight: 500;"></div>
          
          <div style="margin-bottom: 20px;">
            <label style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 6px; display: block;">6-Digit OTP Code</label>
            <input type="text" id="forgot-otp-input" placeholder="e.g. 123456" maxLength="6" style="width: 100%; padding: 12px 16px; font-size: 16px; font-weight: 700; letter-spacing: 0.2em; text-align: center; border: 1.5px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb; outline: none; color: #111827;" />
          </div>

          <button id="forgot-verify-otp-btn" style="width: 100%; padding: 14px; background: #6366f1; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; color: #ffffff; cursor: pointer; box-shadow: 0 4px 12px rgba(99,102,241,0.25);">Verify Code</button>
          <a href="#" id="forgot-back-to-1" style="display: block; text-align: center; margin-top: 14px; font-size: 12px; color: #6b7280; text-decoration: none;">← Change Email</a>
        </div>

        <!-- Step 3 Container: Set Password -->
        <div id="forgot-step-3" style="padding: 24px; display: none;">
          <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280; line-height: 1.5;">Your OTP code is verified! Please enter your new password below.</p>
          <div id="forgot-error-3" style="display: none; padding: 10px 14px; border-radius: 10px; background-color: #fef2f2; border: 1px solid #fee2e2; color: #ef4444; font-size: 13px; margin-bottom: 14px; font-weight: 500;"></div>
          
          <div style="margin-bottom: 16px;">
            <label style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 6px; display: block;">New Password</label>
            <input type="password" id="forgot-new-password" placeholder="Min 8 characters" style="width: 100%; padding: 12px 16px; font-size: 14px; border: 1.5px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb; outline: none; color: #111827;" />
          </div>

          <div style="margin-bottom: 20px;">
            <label style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 6px; display: block;">Confirm New Password</label>
            <input type="password" id="forgot-confirm-password" placeholder="Confirm new password" style="width: 100%; padding: 12px 16px; font-size: 14px; border: 1.5px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb; outline: none; color: #111827;" />
          </div>

          <button id="forgot-reset-btn" style="width: 100%; padding: 14px; background: #16a34a; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; color: #ffffff; cursor: pointer; box-shadow: 0 4px 12px rgba(22,163,74,0.25);">Reset Password</button>
        </div>
      </div>
      <style>
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        #forgot-password-modal input:focus {
          border-color: #6366f1 !important;
          background-color: #ffffff !important;
        }
        #close-forgot-modal:hover, #forgot-back-to-1:hover {
          color: #111827 !important;
        }
      </style>
    `;
    document.body.appendChild(modal);

    // 2. Open Modal Trigger
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Reset steps
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
    document.getElementById('close-forgot-modal').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    // Back to Step 1 Link
    document.getElementById('forgot-back-to-1').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('forgot-step-1').style.display = 'block';
      document.getElementById('forgot-step-2').style.display = 'none';
    });

    // 3. Step 1 Submit: Send OTP code
    document.getElementById('forgot-send-otp-btn').addEventListener('click', () => {
      const emailVal = document.getElementById('forgot-email-input').value.trim();
      const errBanner = document.getElementById('forgot-error-1');
      const sendBtn = document.getElementById('forgot-send-otp-btn');
      
      errBanner.style.display = 'none';
      if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        errBanner.textContent = 'Please enter a valid registered email address.';
        errBanner.style.display = 'block';
        return;
      }

      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending reset code...';

      fetch('http://localhost:5000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal })
      })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.errors ? json.errors.join(' ') : 'Request failed.');
        }
        return json;
      })
      .then((json) => {
        if (json.devOtp) {
          alert(`🔐 DEV MODE — Forgot Password OTP:\n\nYour reset code is: ${json.devOtp}`);
        }
        document.getElementById('forgot-target-email').textContent = emailVal;
        document.getElementById('forgot-step-1').style.display = 'none';
        document.getElementById('forgot-step-2').style.display = 'block';
      })
      .catch((err) => {
        errBanner.textContent = err.message || 'sorry,we dont find account with this mail';
        errBanner.style.display = 'block';
      })
      .finally(() => {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send OTP Code';
      });
    });

    // 4. Step 2 Submit: Verify OTP code local validation
    document.getElementById('forgot-verify-otp-btn').addEventListener('click', () => {
      const otpVal = document.getElementById('forgot-otp-input').value.trim();
      const errBanner = document.getElementById('forgot-error-2');
      
      errBanner.style.display = 'none';
      if (!otpVal || otpVal.length !== 6) {
        errBanner.textContent = 'Please enter the 6-digit OTP verification code.';
        errBanner.style.display = 'block';
        return;
      }

      // Progress to password reset step
      document.getElementById('forgot-step-2').style.display = 'none';
      document.getElementById('forgot-step-3').style.display = 'block';
    });

    // 5. Step 3 Submit: Reset Password
    document.getElementById('forgot-reset-btn').addEventListener('click', () => {
      const emailVal = document.getElementById('forgot-email-input').value.trim();
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

      fetch('http://localhost:5000/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailVal,
          otp: otpVal,
          newPassword: passVal
        })
      })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.errors ? json.errors.join(' ') : 'Reset failed.');
        }
        return json;
      })
      .then(() => {
        alert('Success! Your password has been reset. You can now sign in.');
        modal.style.display = 'none';
      })
      .catch((err) => {
        errBanner.textContent = err.message || 'OTP verification failed. Please try again.';
        errBanner.style.display = 'block';
      })
      .finally(() => {
        resetBtn.disabled = false;
        resetBtn.textContent = 'Reset Password';
      });
    });
  }
});

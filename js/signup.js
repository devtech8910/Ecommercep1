/* ============================================================
   DEVTECH FASHION — SIGNUP JAVASCRIPT (Nike-Style Multi-Step)
   Author: DevTech Solutions (Purna Sai & Prabhas)
   Version: 1.0.0
   ============================================================ */

'use strict';

// ============================================================
// REAL-TIME OTP API CONFIGURATION
// ============================================================
const OTP_CONFIG = {
  // === EMAIL OTP (via EmailJS) ===
  emailjs: {
    enabled: true,
    publicKey: 'd65JAiVI2nOP-tSjB',
    serviceId: 'service_bsuum3h',
    templateId: 'template_mzxvnz9',
  },
  
  // === WHATSAPP OTP (via CallMeBot) ===
  // Get a free API key at https://www.callmebot.com/blog/free-api-whatsapp-messages/
  callmebot: {
    enabled: false,
    apiKey: 'YOUR_CALLMEBOT_API_KEY',
  }
};

// Global variables for OTP verification
let generatedPhoneOtp = '';
let generatedEmailOtp = '';

document.addEventListener('DOMContentLoaded', () => {
  // --- Navigation & Steps ---
  const stepContainers = document.querySelectorAll('.signup-step-container');
  const progressFill   = document.getElementById('progress-fill');
  const stepNodes      = document.querySelectorAll('.step-node');

  // --- Step 1 Elements ---
  const phoneForm     = document.getElementById('phone-form');
  const phoneInput    = document.getElementById('phone-number');
  const phoneError    = document.getElementById('phone-error');
  const countryCode   = document.getElementById('country-code');
  const displayPhone  = document.getElementById('display-phone');

  // --- Step 2 Elements ---
  const otpForm       = document.getElementById('otp-form');
  const otpGroup      = document.getElementById('otp-inputs-group');
  const otpFields     = otpGroup.querySelectorAll('.otp-field');
  const otpError      = document.getElementById('otp-error');
  const otpTimerSec   = document.getElementById('otp-timer-seconds');
  const resendBtn     = document.getElementById('resend-code-btn');
  const backBtn       = document.getElementById('back-to-step-1-btn');

  // --- Step 3 Elements ---
  const detailsForm   = document.getElementById('details-form');
  const firstNameInput= document.getElementById('first-name');
  const lastNameInput = document.getElementById('last-name');
  const dobInput      = document.getElementById('date-of-birth');
  const emailInput    = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const termsCheckbox = document.getElementById('terms-acceptance');
  
  const firstNameErr  = document.getElementById('first-name-error');
  const lastNameErr   = document.getElementById('last-name-error');
  const dobErr        = document.getElementById('dob-error');
  const emailErr      = document.getElementById('email-error');
  const passwordErr   = document.getElementById('password-error');
  const termsErr       = document.getElementById('terms-error');
  
  const passwordToggle = document.getElementById('password-toggle');
  const eyeOffIcon     = passwordToggle.querySelector('.eye-off');
  const eyeOnIcon      = passwordToggle.querySelector('.eye-on');

  let currentStep = 1;
  let timerInterval = null;
  let verifiedPhoneNumber = '';

  // Set current year in footer
  const footerYear = document.getElementById('footer-year');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  // ============================================================
  // STEP NAVIGATION LOGIC
  // ============================================================
  function goToStep(stepNum) {
    currentStep = stepNum;

    // Update Progress Bar Fill Width
    const percentages = { 1: '0%', 2: '50%', 3: '100%' };
    progressFill.style.width = percentages[stepNum];

    // Update Step Nodes Styling
    stepNodes.forEach((node, idx) => {
      const nodeStep = idx + 1;
      if (nodeStep < stepNum) {
        node.className = 'step-node completed';
        node.innerHTML = '✓';
      } else if (nodeStep === stepNum) {
        node.className = 'step-node active';
        node.innerHTML = nodeStep;
      } else {
        node.className = 'step-node';
        node.innerHTML = nodeStep;
      }
    });

    // Toggle Steps Containers with Smooth Fade-in
    stepContainers.forEach(container => {
      container.classList.remove('active');
    });
    
    const targetContainer = document.getElementById(`signup-step-${stepNum}`);
    if (targetContainer) {
      targetContainer.classList.add('active');
      
      // Auto focus primary inputs
      if (stepNum === 1) phoneInput.focus();
      if (stepNum === 2) otpFields[0].focus();
      if (stepNum === 3) firstNameInput.focus();
    }
  }

  // ============================================================
  // STEP 1: PHONE FORM VALIDATION & SUBMIT
  // ============================================================
  phoneInput.addEventListener('input', () => {
    // Strip non-numeric characters and cap at strictly 10 digits
    phoneInput.value = phoneInput.value.replace(/[^0-9]/g, '').slice(0, 10);
    if (phoneInput.classList.contains('input-error')) {
      clearError(phoneInput, phoneError);
    }
  });

  phoneForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phoneVal = phoneInput.value.trim();

    if (!phoneVal) {
      showError(phoneInput, phoneError, 'Mobile number is required.');
      return;
    }

    if (phoneVal.length !== 10) {
      showError(phoneInput, phoneError, 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const checkPhoneNum = `${countryCode.value}${phoneVal}`;
    const phoneSubmitBtn = document.getElementById('phone-submit-btn');
    const submitSpan = phoneSubmitBtn.querySelector('span');

    phoneSubmitBtn.disabled = true;
    if (submitSpan) submitSpan.textContent = 'Verifying...';

    // 1. Check if phone is already registered (local storage + remote API)
    let isAlreadyRegistered = false;

    try {
      const registeredUsers = JSON.parse(localStorage.getItem('dtf_registered_users') || '[]');
      const currentUser = JSON.parse(localStorage.getItem('dtf_user') || 'null');
      const cleanInput = phoneVal.replace(/[^0-9]/g, '');

      const matchRegistered = registeredUsers.some(u => u.phone && u.phone.replace(/[^0-9]/g, '').endsWith(cleanInput));
      const matchCurrent = currentUser && currentUser.phone && currentUser.phone.replace(/[^0-9]/g, '').endsWith(cleanInput);

      if (matchRegistered || matchCurrent) {
        isAlreadyRegistered = true;
      }
    } catch (err) {
      console.warn('Local registered users check error:', err);
    }

    if (!isAlreadyRegistered) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(`http://localhost:5000/auth/check-phone?phone=${encodeURIComponent(checkPhoneNum)}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.exists) {
            isAlreadyRegistered = true;
          }
        }
      } catch (err) {
        console.log('Backend check-phone unreachable, relying on client verification:', err.message);
      }
    }

    if (isAlreadyRegistered) {
      showError(phoneInput, phoneError, 'This mobile number is already registered. Please login or use a different number.');
      phoneSubmitBtn.disabled = false;
      if (submitSpan) submitSpan.textContent = 'Send OTP Code';
      return;
    }

    // 2. Unused Phone Number — Generate OTP & Display in Alert on Same Device
    verifiedPhoneNumber = checkPhoneNum;
    displayPhone.textContent = `${countryCode.value} ${phoneVal}`;
    if (submitSpan) submitSpan.textContent = 'Sending OTP...';

    // Generate 6-digit random code
    generatedPhoneOtp = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('dtf_signup_otp', generatedPhoneOtp);

    // Prompt user with OTP in Alert Section on Webpage
    alert(`🔑 DevTech Verification Code\n\nYour OTP is: ${generatedPhoneOtp}\n\nPlease enter this 6-digit code on the next screen to verify your phone number.`);

    if (window.showToast) {
      window.showToast(`Your Verification OTP is: ${generatedPhoneOtp}`, 'info');
    }

    setTimeout(() => {
      phoneSubmitBtn.disabled = false;
      if (submitSpan) submitSpan.textContent = 'Send OTP Code';
      goToStep(2);
      startOTPTimer();
    }, 600);
  });

  // ============================================================
  // STEP 2: OTP FIELD DYNAMICS, TIMER & VERIFY
  // ============================================================
  
  // Shift Focus Auto on keypress
  otpFields.forEach((field, index) => {
    field.addEventListener('input', (e) => {
      // Allow only numbers
      field.value = field.value.replace(/[^0-9]/g, '');
      
      if (field.value.length === 1) {
        if (index < otpFields.length - 1) {
          otpFields[index + 1].focus();
        }
      }
      clearError(otpFields[0], otpError); // clear error on any edit
    });

    field.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && field.value.length === 0) {
        if (index > 0) {
          otpFields[index - 1].focus();
        }
      }
    });
  });

  // OTP Countdown Timer
  function startOTPTimer() {
    clearInterval(timerInterval);
    resendBtn.disabled = true;
    resendBtn.classList.add('disabled');
    
    let secondsLeft = 59;
    otpTimerSec.textContent = secondsLeft;

    timerInterval = setInterval(() => {
      secondsLeft--;
      otpTimerSec.textContent = secondsLeft;

      if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        resendBtn.disabled = false;
        resendBtn.classList.remove('disabled');
      }
    }, 1000);
  }

  // Resend Button Click
  resendBtn.addEventListener('click', () => {
    if (resendBtn.disabled) return;
    
    // reset fields
    otpFields.forEach(f => f.value = '');
    clearError(otpFields[0], otpError);

    // simulate sending
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending...';

    setTimeout(() => {
      resendBtn.textContent = 'Resend Code';
      startOTPTimer();
    }, 1000);
  });

  // Step 2 Back navigation
  backBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    goToStep(1);
  });

  // OTP Verification Submit
  otpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let code = '';
    otpFields.forEach(f => code += f.value);

    if (code.length < 6) {
      showError(otpFields[0], otpError, 'Please enter all 6 digits of the verification code.');
      otpFields.forEach(f => f.classList.add('input-error'));
      return;
    }

    const activeOtp = generatedPhoneOtp || sessionStorage.getItem('dtf_signup_otp');

    // Strict OTP Validation — Must match the generated OTP shown in alert
    if (activeOtp && code.trim() !== activeOtp.trim()) {
      showError(otpFields[0], otpError, 'Invalid OTP entered. Please enter the exact 6-digit OTP code shown in the alert.');
      otpFields.forEach(f => f.classList.add('input-error'));
      return;
    }

    // Success Step 2
    const otpSubmitBtn = document.getElementById('otp-submit-btn');
    const submitSpan = otpSubmitBtn.querySelector('span');
    otpSubmitBtn.disabled = true;
    if (submitSpan) submitSpan.textContent = 'Verifying code...';

    setTimeout(() => {
      otpSubmitBtn.disabled = false;
      if (submitSpan) submitSpan.textContent = 'Verify OTP';

      // Clear field errors
      otpFields.forEach(f => f.classList.remove('input-error'));
      clearError(otpFields[0], otpError);

      clearInterval(timerInterval);
      goToStep(3);
    }, 600);
  });


  // ============================================================
  // STEP 3: ACCOUNT DETAILS VALIDATION & SUBMIT
  // ============================================================

  const emailVerifyTrigger = document.getElementById('email-verify-trigger');
  const emailOtpBlock      = document.getElementById('email-otp-block');
  const emailOtpInput      = document.getElementById('email-otp-input');
  const emailOtpSubmit     = document.getElementById('email-otp-submit');
  const emailOtpError      = document.getElementById('email-otp-error');
  
  let isEmailVerified = false;
  let isPasswordStrong = false;

  // Email verification trigger
  // Email verification trigger
  if (emailVerifyTrigger) {
    emailVerifyTrigger.addEventListener('click', async () => {
      const emailVal = emailInput.value.trim();
      if (!emailVal) {
        showError(emailInput, emailErr, 'Email address is required.');
        return;
      }
      if (!validateEmail(emailVal)) {
        showError(emailInput, emailErr, 'Please enter a valid email address.');
        return;
      }

      clearError(emailInput, emailErr);
      emailVerifyTrigger.disabled = true;
      emailVerifyTrigger.textContent = 'Verifying...';

      // 1. Check if email is already registered (local storage + remote API)
      let isAlreadyRegistered = false;

      try {
        const registeredUsers = JSON.parse(localStorage.getItem('dtf_registered_users') || '[]');
        const currentUser = JSON.parse(localStorage.getItem('dtf_user') || 'null');
        const cleanEmail = emailVal.toLowerCase();

        const matchRegistered = registeredUsers.some(u => u.email && u.email.toLowerCase() === cleanEmail);
        const matchCurrent = currentUser && currentUser.email && currentUser.email.toLowerCase() === cleanEmail;

        if (matchRegistered || matchCurrent) {
          isAlreadyRegistered = true;
        }
      } catch (err) {
        console.warn('Local registered users check error:', err);
      }

      if (!isAlreadyRegistered) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const res = await fetch(`http://localhost:5000/auth/check-email?email=${encodeURIComponent(emailVal)}`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const json = await res.json();
            if (json.success && json.exists) {
              isAlreadyRegistered = true;
            }
          }
        } catch (err) {
          console.log('Backend check-email unreachable, relying on client verification:', err.message);
        }
      }

      if (isAlreadyRegistered) {
        showError(emailInput, emailErr, 'An account with this email address already exists. Please login or use a different email.');
        emailVerifyTrigger.disabled = false;
        emailVerifyTrigger.textContent = 'Verify';
        return;
      }

      // 2. Unused Email — Generate 6-digit OTP & display verification modal
      emailVerifyTrigger.textContent = 'Sending...';
      generatedEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem('dtf_email_otp', generatedEmailOtp);

      // Call EmailJS to send OTP in realtime to user's email
      if (OTP_CONFIG.emailjs.enabled && typeof emailjs !== 'undefined') {
        try {
          emailjs.send(OTP_CONFIG.emailjs.serviceId, OTP_CONFIG.emailjs.templateId, {
            to_email: emailVal,
            otp_code: generatedEmailOtp,
            to_name: 'DevTech Member'
          });
          console.log(`[DevTech] Realtime Email OTP sent to ${emailVal} via EmailJS: ${generatedEmailOtp}`);
        } catch (err) {
          console.warn('EmailJS transmission note:', err);
        }
      } else {
        console.log(`[DevTech] Realtime Email OTP generated for ${emailVal}: ${generatedEmailOtp}`);
      }

      setTimeout(() => {
        emailOtpBlock.style.display = 'block';
        emailVerifyTrigger.textContent = 'Verify';
        emailVerifyTrigger.disabled = false;
        emailOtpInput.focus();
        startResendTimer(); // Start 60-second resend cooldown
      }, 600);
    });
  }

  // ============================================================
  // EMAIL OTP RESEND WITH 60-SECOND COOLDOWN
  // ============================================================
  const resendOtpBtn = document.getElementById('resend-email-otp-btn');
  const resendTimerSpan = document.getElementById('resend-otp-timer');
  let resendInterval = null;

  function startResendTimer() {
    let seconds = 60;
    if (resendOtpBtn) {
      resendOtpBtn.disabled = true;
      resendOtpBtn.style.opacity = '0.4';
      resendOtpBtn.style.cursor = 'not-allowed';
    }
    if (resendTimerSpan) resendTimerSpan.textContent = `(${seconds}s)`;

    if (resendInterval) clearInterval(resendInterval);
    resendInterval = setInterval(() => {
      seconds--;
      if (resendTimerSpan) resendTimerSpan.textContent = `(${seconds}s)`;
      if (seconds <= 0) {
        clearInterval(resendInterval);
        resendInterval = null;
        if (resendOtpBtn) {
          resendOtpBtn.disabled = false;
          resendOtpBtn.style.opacity = '1';
          resendOtpBtn.style.cursor = 'pointer';
        }
        if (resendTimerSpan) resendTimerSpan.textContent = '';
      }
    }, 1000);
  }

  if (resendOtpBtn) {
    resendOtpBtn.addEventListener('click', async () => {
      const emailVal = emailInput.value.trim();
      if (!emailVal || !validateEmail(emailVal)) return;

      resendOtpBtn.disabled = true;
      resendOtpBtn.style.opacity = '0.4';

      // Generate new OTP
      generatedEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem('dtf_email_otp', generatedEmailOtp);

      // Send via EmailJS
      if (OTP_CONFIG.emailjs.enabled && typeof emailjs !== 'undefined') {
        try {
          await emailjs.send(OTP_CONFIG.emailjs.serviceId, OTP_CONFIG.emailjs.templateId, {
            to_email: emailVal,
            otp_code: generatedEmailOtp,
            to_name: 'DevTech Member'
          });
          console.log(`[DevTech] Resent Email OTP to ${emailVal} via EmailJS: ${generatedEmailOtp}`);
        } catch (err) {
          console.warn('EmailJS resend failed:', err);
        }
      } else {
        console.log(`[DevTech] Resent Email OTP for ${emailVal}: ${generatedEmailOtp}`);
      }

      // Restart 60-second cooldown
      startResendTimer();
    });
  }

  // Email OTP confirmation code submit
  if (emailOtpSubmit) {
    emailOtpSubmit.addEventListener('click', () => {
      const otpVal = emailOtpInput.value.trim();
      if (otpVal.length < 6) {
        showError(emailOtpInput, emailOtpError, 'Please enter all 6 digits of the email verification code.');
        return;
      }

      const activeOtp = generatedEmailOtp || sessionStorage.getItem('dtf_email_otp');

      // Strict Email OTP Validation — Must match generated OTP
      if (activeOtp && otpVal !== activeOtp.trim()) {
        showError(emailOtpInput, emailOtpError, 'Invalid OTP entered. Please enter the exact 6-digit code shown in the alert.');
        return;
      }

      emailOtpSubmit.disabled = true;
      emailOtpSubmit.textContent = 'Confirming...';

      setTimeout(() => {
        isEmailVerified = true;
        emailOtpBlock.style.display = 'none';
        emailVerifyTrigger.textContent = '✓ Verified';
        emailVerifyTrigger.disabled = true;
        emailVerifyTrigger.classList.add('verified');
        emailInput.disabled = true; // Lock email field
        clearError(emailInput, emailErr);
        clearError(emailOtpInput, emailOtpError);
      }, 600);
    });
  }

  // Password Strength evaluation rules
  const rules = {
    length: { el: document.getElementById('rule-length'), regex: /.{8,}/ },
    uppercase: { el: document.getElementById('rule-uppercase'), regex: /[A-Z]/ },
    lowercase: { el: document.getElementById('rule-lowercase'), regex: /[a-z]/ },
    number: { el: document.getElementById('rule-number'), regex: /[0-9]/ },
    special: { el: document.getElementById('rule-special'), regex: /[!@#$%^&*(),.?":{}|<>]/ }
  };

  passwordInput.addEventListener('input', () => {
    const passwordVal = passwordInput.value;
    let allMet = true;

    // Check each password rule in real time
    for (const key in rules) {
      const rule = rules[key];
      const met = rule.regex.test(passwordVal);
      
      if (met) {
        rule.el.classList.add('met');
      } else {
        rule.el.classList.remove('met');
        allMet = false;
      }
    }

    isPasswordStrong = allMet;
    if (isPasswordStrong && passwordInput.classList.contains('input-error')) {
      clearError(passwordInput, passwordErr);
    }
  });

  // Password Visibility Toggle
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

  // Clear errors dynamically
  [firstNameInput, lastNameInput, dobInput, emailInput, passwordInput].forEach(inp => {
    inp.addEventListener('input', () => {
      inp.classList.remove('input-error');
      const errEl = document.getElementById(`${inp.id}-error`);
      if (errEl) {
        errEl.textContent = '';
        errEl.style.opacity = '0';
      }
    });
  });

  termsCheckbox.addEventListener('change', () => {
    if (termsCheckbox.checked) {
      termsErr.textContent = '';
      termsErr.style.opacity = '0';
    }
  });

  function calculateAge(dobString) {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  function checkAgeAndShowError() {
    if (!dobInput.value) {
      showError(dobInput, dobErr, 'Date of Birth is a mandatory field.');
      return false;
    }
    const userAge = calculateAge(dobInput.value);
    if (isNaN(userAge) || userAge < 18) {
      showError(dobInput, dobErr, 'Under 18 years are not allowed to create an account.');
      return false;
    }
    clearError(dobInput, dobErr);
    return true;
  }

  // Real-time instant age check on DOB input, change, and blur events
  ['input', 'change', 'blur'].forEach(evt => {
    dobInput.addEventListener(evt, checkAgeAndShowError);
  });

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  detailsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let isDetailsValid = true;

    // First Name
    if (!firstNameInput.value.trim()) {
      showError(firstNameInput, firstNameErr, 'First name is required.');
      isDetailsValid = false;
    }

    // Last Name
    if (!lastNameInput.value.trim()) {
      showError(lastNameInput, lastNameErr, 'Last name is required.');
      isDetailsValid = false;
    }

    // DOB — Under 18 years not allowed
    if (!checkAgeAndShowError()) {
      isDetailsValid = false;
    }

    // Email verification check
    if (!emailInput.value.trim()) {
      showError(emailInput, emailErr, 'Email address is required.');
      isDetailsValid = false;
    } else if (!validateEmail(emailInput.value.trim())) {
      showError(emailInput, emailErr, 'Please enter a valid email address.');
      isDetailsValid = false;
    } else if (!isEmailVerified) {
      showError(emailInput, emailErr, 'Please click Verify to authenticate your email.');
      isDetailsValid = false;
    }

    // Password strength check
    if (!passwordInput.value) {
      showError(passwordInput, passwordErr, 'Please set a secure password.');
      isDetailsValid = false;
    } else if (!isPasswordStrong) {
      showError(passwordInput, passwordErr, 'Password does not meet the security rules below.');
      isDetailsValid = false;
    }

    // Terms checkbox check
    if (!termsCheckbox.checked) {
      termsErr.textContent = 'You must accept the terms & conditions to sign up.';
      termsErr.style.opacity = '1';
      isDetailsValid = false;
    }

    if (isDetailsValid) {
      const detailsSubmitBtn = document.getElementById('signup-submit-btn');
      const submitSpan = detailsSubmitBtn.querySelector('span');
      detailsSubmitBtn.disabled = true;
      if (submitSpan) submitSpan.textContent = 'Creating Account...';

      const userObj = {
        name: `${firstNameInput.value.trim()} ${lastNameInput.value.trim()}`,
        email: emailInput.value.trim(),
        phone: verifiedPhoneNumber,
        dob: dobInput.value,
        password: passwordInput.value,
        role: 'customer',
        token: 'dtf_token_' + Date.now()
      };

      // Store logged in user & update registered users array in localStorage
      localStorage.setItem('dtf_user', JSON.stringify(userObj));
      localStorage.setItem('token', userObj.token);

      try {
        const registeredUsers = JSON.parse(localStorage.getItem('dtf_registered_users') || '[]');
        registeredUsers.push(userObj);
        localStorage.setItem('dtf_registered_users', JSON.stringify(registeredUsers));
      } catch (err) {
        console.warn('Failed to update dtf_registered_users:', err);
      }

      // Attempt remote backend registration if online
      fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstNameInput.value.trim(),
          lastName: lastNameInput.value.trim(),
          email: emailInput.value.trim(),
          phone: verifiedPhoneNumber,
          dob: dobInput.value,
          password: passwordInput.value
        })
      }).catch((err) => {
        console.log('Backend server offline/running on Netlify; local registration completed:', err.message);
      });

      if (submitSpan) submitSpan.textContent = 'Account Setup Complete!';
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 1000);
    }
  });


  // ============================================================
  // ERROR HELPERS
  // ============================================================
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

});

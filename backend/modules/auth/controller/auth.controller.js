import * as service from '../service/auth.service.js';

function sanitize(val) {
  if (typeof val !== 'string') return val;
  return val.replace(/<[^>]*>/g, '').trim();
}

export async function register(req, res) {
  try {
    const { firstName, lastName, email, phone, password, dob } = req.body;

    const errors = [];
    if (!firstName || sanitize(firstName).length < 2) errors.push('First name is required (min 2 chars).');
    if (!lastName || sanitize(lastName).length < 2) errors.push('Last name is required (min 2 chars).');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email address is required.');
    if (!phone || !/^\+?\d{10,15}$/.test(phone)) errors.push('Mobile number must be a valid 10-15 digit number (including optional country code).');
    if (!password || password.length < 8) errors.push('Password must be at least 8 characters long.');

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const result = await service.registerUser({
      firstName: sanitize(firstName),
      lastName: sanitize(lastName),
      email: sanitize(email),
      phone: sanitize(phone),
      dob: dob ? sanitize(dob) : null,
      password
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: result
    });
  } catch (error) {
    console.error('Registration controller error:', error);
    return res.status(400).json({ success: false, errors: [error.message] });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const errors = [];
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email address is required.');
    if (!password) errors.push('Password is required.');

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const result = await service.loginUser(sanitize(email), password);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result
    });
  } catch (error) {
    console.error('Login controller error:', error);
    return res.status(401).json({ success: false, errors: [error.message] });
  }
}

export async function checkPhone(req, res) {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number parameter is required.' });
    }
    const user = await service.getUserByPhone(sanitize(phone));
    return res.status(200).json({ success: true, exists: !!user });
  } catch (error) {
    console.error('checkPhone error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function checkEmail(req, res) {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email parameter is required.' });
    }
    const user = await service.getUserByEmail(sanitize(email));
    return res.status(200).json({ success: true, exists: !!user });
  } catch (error) {
    console.error('checkEmail error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function getProfile(req, res) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    const user = await service.getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    const { password_hash, ...userWithoutPassword } = user;
    return res.status(200).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function updateProfile(req, res) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    const { firstName, lastName, email, phone, dob, password } = req.body;

    const errors = [];
    if (!firstName || sanitize(firstName).length < 2) errors.push('First name is required (min 2 chars).');
    if (!lastName || sanitize(lastName).length < 2) errors.push('Last name is required (min 2 chars).');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email address is required.');
    if (!phone || !/^\+?\d{10,15}$/.test(phone)) errors.push('Mobile number must be a valid 10-15 digit number.');

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const result = await service.updateUser(req.userId, {
      firstName: sanitize(firstName),
      lastName: sanitize(lastName),
      email: sanitize(email),
      phone: sanitize(phone),
      dob: dob ? sanitize(dob) : null,
      password
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: result
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(400).json({ success: false, errors: [error.message] });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, errors: ['A valid email address is required.'] });
    }

    const otp = await service.sendForgotPasswordOtp(sanitize(email));
    
    return res.status(200).json({
      success: true,
      message: 'Password reset OTP has been sent successfully to your email.',
      devOtp: otp // DEV MODE: remove when real OTPs are enabled
    });
  } catch (error) {
    console.error('forgotPassword error:', error);
    return res.status(400).json({ success: false, errors: [error.message] });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    
    const errors = [];
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email address is required.');
    if (!otp || otp.trim().length !== 6) errors.push('A valid 6-digit OTP is required.');
    if (!newPassword || newPassword.length < 8) errors.push('New password must be at least 8 characters long.');

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    await service.resetUserPassword({
      email: sanitize(email),
      otp: otp.trim(),
      newPassword
    });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(400).json({ success: false, errors: [error.message] });
  }
}

export async function sendVerificationOtp(req, res) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    const { type, value } = req.body;
    if (!type || !value) {
      return res.status(400).json({ success: false, errors: ['Type and value are required.'] });
    }

    if (type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return res.status(400).json({ success: false, errors: ['A valid email address is required.'] });
      }
      const existing = await service.getUserByEmail(sanitize(value));
      if (existing && existing.id !== req.userId) {
        return res.status(400).json({ success: false, errors: ['Email is already in use by another account.'] });
      }
    } else if (type === 'phone') {
      if (!/^\d{10}$/.test(value)) {
        return res.status(400).json({ success: false, errors: ['Mobile number must be exactly 10 digits.'] });
      }
      const existing = await service.getUserByPhone(sanitize(value));
      if (existing && existing.id !== req.userId) {
        return res.status(400).json({ success: false, errors: ['Mobile number is already in use by another account.'] });
      }
    } else {
      return res.status(400).json({ success: false, errors: ['Invalid verification type.'] });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await service.saveVerificationOtp(sanitize(value), otp, expiresAt);

    console.log(`\n📨 ============================================================`);
    console.log(`📨 [VERIFICATION OTP SUCCESS] OTP code to verify new ${type} "${value}" is: ${otp}`);
    console.log(`📨 Expires at: ${expiresAt.toLocaleTimeString()}`);
    console.log(`📨 ============================================================\n`);

    return res.status(200).json({
      success: true,
      message: `Verification code sent to your new ${type}.`,
      devOtp: otp // DEV MODE: remove when real OTPs are enabled
    });
  } catch (error) {
    console.error('sendVerificationOtp error:', error);
    return res.status(400).json({ success: false, errors: [error.message] });
  }
}

export async function verifyAndUpdateProfile(req, res) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    const { firstName, lastName, email, phone, dob, emailOtp, phoneOtp } = req.body;

    const errors = [];
    if (!firstName || sanitize(firstName).length < 2) errors.push('First name is required (min 2 chars).');
    if (!lastName || sanitize(lastName).length < 2) errors.push('Last name is required (min 2 chars).');

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const result = await service.verifyAndUpdateProfile(req.userId, {
      firstName: sanitize(firstName),
      lastName: sanitize(lastName),
      email: sanitize(email),
      phone: sanitize(phone),
      dob: dob ? sanitize(dob) : null,
      emailOtp: emailOtp ? emailOtp.trim() : null,
      phoneOtp: phoneOtp ? phoneOtp.trim() : null
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: result
    });
  } catch (error) {
    console.error('verifyAndUpdateProfile error:', error);
    return res.status(400).json({ success: false, errors: [error.message] });
  }
}

export async function requestDeleteAccount(req, res) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const { emailOtp, phoneOtp } = await service.requestDeleteAccountOtp(req.userId);

    return res.status(200).json({
      success: true,
      message: 'OTPs generated successfully to verify account deletion.',
      devEmailOtp: emailOtp,
      devPhoneOtp: phoneOtp
    });
  } catch (error) {
    console.error('requestDeleteAccount error:', error);
    return res.status(400).json({ success: false, errors: [error.message] });
  }
}

export async function confirmDeleteAccount(req, res) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const { emailOtp, phoneOtp, acceptedTerms } = req.body;
    const result = await service.confirmDeleteAccount(req.userId, { emailOtp, phoneOtp, acceptedTerms });

    return res.status(200).json({
      success: true,
      message: 'Account deletion request scheduled successfully.',
      data: result
    });
  } catch (error) {
    console.error('confirmDeleteAccount error:', error);
    return res.status(400).json({ success: false, errors: [error.message] });
  }
}

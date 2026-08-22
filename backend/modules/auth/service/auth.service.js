import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as repository from '../repository/auth.repository.js';
import { getJwtSecret } from '../../../config/jwt.config.js';

const JWT_SECRET = getJwtSecret();
const PROFILE_EDIT_LIMIT_PER_YEAR = 2;

function currentEditYear() {
  return new Date().getFullYear();
}

function normalizeComparable(value) {
  return value == null ? '' : String(value).trim();
}

function normalizePhoneComparable(value) {
  return normalizeComparable(value).replace(/^\+91/, '');
}

function normalizeDateComparable(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function hasProfileDetailsChanged(user, updateData) {
  return (
    normalizeComparable(user.first_name) !== normalizeComparable(updateData.firstName) ||
    normalizeComparable(user.last_name) !== normalizeComparable(updateData.lastName) ||
    normalizeComparable(user.email).toLowerCase() !== normalizeComparable(updateData.email).toLowerCase() ||
    normalizePhoneComparable(user.phone) !== normalizePhoneComparable(updateData.phone) ||
    normalizeDateComparable(user.date_of_birth) !== normalizeDateComparable(updateData.dob)
  );
}

async function getProfileEditLimit(userId) {
  const year = currentEditYear();
  const used = await repository.getProfileEditUsage(userId, year);
  return {
    year,
    limit: PROFILE_EDIT_LIMIT_PER_YEAR,
    used,
    remaining: Math.max(PROFILE_EDIT_LIMIT_PER_YEAR - used, 0)
  };
}

async function assertProfileEditAllowed(userId) {
  const usage = await getProfileEditLimit(userId);
  if (usage.used >= PROFILE_EDIT_LIMIT_PER_YEAR) {
    throw new Error(`You have already used your ${PROFILE_EDIT_LIMIT_PER_YEAR} account detail edits for ${usage.year}. You can edit again next year.`);
  }
  return usage;
}

export async function registerUser(userData) {
  const existingUser = await repository.findUserByEmail(userData.email);
  if (existingUser) {
    if (existingUser.deleted_at) {
      const deletedTime = new Date(existingUser.deleted_at).getTime();
      const timeDiff = Date.now() - deletedTime;
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      if (timeDiff < thirtyDaysMs) {
        throw new Error('This account is currently scheduled for deletion. Log in to cancel the request and restore your account.');
      } else {
        await repository.permanentlyDeleteUser(existingUser.id);
      }
    } else {
      throw new Error('Email address is already registered.');
    }
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(userData.password, salt);

  const newUser = await repository.createUser({
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    phone: userData.phone,
    dob: userData.dob,
    passwordHash
  });

  // Generate JWT token (expires in 7 days)
  const token = jwt.sign(
    { userId: newUser.id, email: newUser.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password_hash, ...userWithoutPassword } = newUser;
  return { user: userWithoutPassword, token };
}

export async function loginUser(email, password) {
  const user = await repository.findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  if (user.deleted_at) {
    const deletedTime = new Date(user.deleted_at).getTime();
    const timeDiff = Date.now() - deletedTime;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (timeDiff < thirtyDaysMs) {
      await repository.cancelUserDeletion(user.id);
      user.deleted_at = null;
    } else {
      throw new Error('Invalid email or password.');
    }
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password_hash, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
}

export async function getUserByPhone(phone) {
  return repository.findUserByPhone(phone);
}

export async function getUserByEmail(email) {
  return repository.findUserByEmail(email);
}

export async function getUserById(id) {
  return repository.findUserById(id);
}

export async function getUserProfile(id) {
  const user = await repository.findUserById(id);
  if (!user) return null;
  const profileEditLimit = await getProfileEditLimit(id);
  return { ...user, profileEditLimit };
}

export async function updateUser(id, updateData) {
  const currentUser = await repository.findUserById(id);
  if (!currentUser) {
    throw new Error('User not found.');
  }

  const emailUser = await repository.findUserByEmail(updateData.email);
  if (emailUser && emailUser.id !== id) {
    throw new Error('Email address is already in use by another user.');
  }

  const phoneUser = await repository.findUserByPhone(updateData.phone);
  if (phoneUser && phoneUser.id !== id) {
    throw new Error('Mobile number is already in use by another user.');
  }

  let passwordHash = null;
  if (updateData.password && updateData.password.trim().length >= 8) {
    const salt = await bcrypt.genSalt(10);
    passwordHash = await bcrypt.hash(updateData.password, salt);
  }

  const detailsChanged = hasProfileDetailsChanged(currentUser, updateData);
  if (detailsChanged) {
    await assertProfileEditAllowed(id);
  }

  const updatedUser = await repository.updateUser(id, {
    firstName: updateData.firstName,
    lastName: updateData.lastName,
    email: updateData.email,
    phone: updateData.phone,
    dob: updateData.dob,
    passwordHash
  });

  if (detailsChanged) {
    await repository.recordProfileEdit(id, currentEditYear());
  }

  return { ...updatedUser, profileEditLimit: await getProfileEditLimit(id) };
}

export async function sendForgotPasswordOtp(email) {
  const user = await repository.findUserByEmail(email);
  if (!user) {
    throw new Error('sorry,we dont find account with this mail');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await repository.saveResetOtp(email, otp, expiresAt);

  console.log(`\n📨 ============================================================`);
  console.log(`📨 [OTP SEND SUCCESS] Reset code for email "${email}" is: ${otp}`);
  console.log(`📨 Expires at: ${expiresAt.toLocaleTimeString()}`);
  console.log(`📨 ============================================================\n`);

  return otp; // DEV MODE: return OTP for popup alert
}

export async function resetUserPassword({ email, otp, newPassword }) {
  const resetRecord = await repository.findResetRecord(email, otp);
  if (!resetRecord) {
    throw new Error('Invalid or expired password reset OTP.');
  }

  if (new Date() > new Date(resetRecord.expires_at)) {
    await repository.deleteResetRecord(email);
    throw new Error('This password reset OTP has expired. Please request a new one.');
  }

  const user = await repository.findUserByEmail(email);
  if (!user) {
    throw new Error('User not found.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await repository.updateUserPassword(user.id, passwordHash);
  await repository.deleteResetRecord(email);
}

export async function saveVerificationOtp(value, otp, expiresAt) {
  await repository.saveResetOtp(value, otp, expiresAt);
}

export async function verifyAndUpdateProfile(userId, updateData) {
  const user = await repository.findUserById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  const requestedData = {
    firstName: updateData.firstName,
    lastName: updateData.lastName,
    email: updateData.email,
    phone: updateData.phone,
    dob: updateData.dob
  };
  const detailsChanged = hasProfileDetailsChanged(user, requestedData);
  if (detailsChanged) {
    await assertProfileEditAllowed(userId);
  }

  let email = user.email;
  if (updateData.email !== user.email) {
    const existing = await repository.findUserByEmail(updateData.email);
    if (existing && existing.id !== userId) {
      throw new Error('Email is already registered by another account.');
    }
    
    if (!updateData.emailOtp) {
      throw new Error('Verification OTP is required to change email address.');
    }
    const record = await repository.findResetRecord(updateData.email, updateData.emailOtp);
    if (!record || new Date() > new Date(record.expires_at)) {
      throw new Error('Invalid or expired verification OTP for new email.');
    }
    
    email = updateData.email;
    await repository.deleteResetRecord(updateData.email);
  }

  let phone = user.phone;
  if (updateData.phone !== user.phone) {
    const existing = await repository.findUserByPhone(updateData.phone);
    if (existing && existing.id !== userId) {
      throw new Error('Mobile number is already registered by another account.');
    }
    
    if (!updateData.phoneOtp) {
      throw new Error('Verification OTP is required to change mobile number.');
    }
    const record = await repository.findResetRecord(updateData.phone, updateData.phoneOtp);
    if (!record || new Date() > new Date(record.expires_at)) {
      throw new Error('Invalid or expired verification OTP for new mobile number.');
    }
    
    phone = updateData.phone;
    await repository.deleteResetRecord(updateData.phone);
  }

  const updatedUser = await repository.updateUser(userId, {
    firstName: updateData.firstName,
    lastName: updateData.lastName,
    email,
    phone,
    dob: updateData.dob,
    passwordHash: null
  });

  if (detailsChanged) {
    await repository.recordProfileEdit(userId, currentEditYear());
  }

  return { ...updatedUser, profileEditLimit: await getProfileEditLimit(userId) };
}

export async function requestDeleteAccountOtp(userId) {
  const user = await repository.findUserById(userId);
  if (!user) throw new Error('User not found.');

  const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await repository.saveResetOtp(user.email, emailOtp, expiresAt);
  await repository.saveResetOtp(user.phone, phoneOtp, expiresAt);

  console.log(`\n📨 ============================================================`);
  console.log(`📨 [DELETE ACCOUNT OTP] Email OTP code to verify delete is: ${emailOtp} (sent to ${user.email})`);
  console.log(`📨 [DELETE ACCOUNT OTP] Phone OTP code to verify delete is: ${phoneOtp} (sent to ${user.phone})`);
  console.log(`📨 Expires at: ${expiresAt.toLocaleTimeString()}`);
  console.log(`📨 ============================================================\n`);

  return { emailOtp, phoneOtp };
}

export async function confirmDeleteAccount(userId, { emailOtp, phoneOtp, acceptedTerms }) {
  if (!acceptedTerms) {
    throw new Error('You must accept the terms and conditions to schedule account deletion.');
  }

  const user = await repository.findUserById(userId);
  if (!user) throw new Error('User not found.');

  // Verify Email OTP
  const emailRecord = await repository.findResetRecord(user.email, emailOtp);
  if (!emailRecord || new Date() > new Date(emailRecord.expires_at)) {
    throw new Error('Invalid or expired email OTP.');
  }

  // Verify Phone OTP
  const phoneRecord = await repository.findResetRecord(user.phone, phoneOtp);
  if (!phoneRecord || new Date() > new Date(phoneRecord.expires_at)) {
    throw new Error('Invalid or expired mobile OTP.');
  }

  // Both verified! Delete reset records and schedule deletion
  await repository.deleteResetRecord(user.email);
  await repository.deleteResetRecord(user.phone);

  await repository.scheduleUserDeletion(userId);
  return { scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
}

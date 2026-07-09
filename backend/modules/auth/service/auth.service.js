import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as repository from '../repository/auth.repository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'devtech_fashion_secret_key';

export async function registerUser(userData) {
  const existingUser = await repository.findUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('Email address is already registered.');
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

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

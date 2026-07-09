import * as service from '../service/address.service.js';

// Simple XSS and basic sanitization helper
function sanitize(val) {
  if (typeof val !== 'string') return val;
  return val.replace(/<[^>]*>/g, '').trim();
}

function isValidId(id) {
  return /^\d+$/.test(id);
}

function validateAddressData(data) {
  const errors = [];

  // Check required location fields
  if (!data.houseNumber || !sanitize(data.houseNumber)) errors.push('House number is required.');
  if (!data.street || !sanitize(data.street)) errors.push('Street name is required.');
  if (!data.area || !sanitize(data.area)) errors.push('Area / Town is required.');
  if (!data.city || !sanitize(data.city)) errors.push('City is required.');
  if (!data.state || !sanitize(data.state)) errors.push('State is required.');
  if (!data.pincode || !/^\d{6}$/.test(data.pincode)) errors.push('A valid 6-digit PIN code is required.');

  // Coordinates check
  if (data.latitude === undefined || data.longitude === undefined || isNaN(parseFloat(data.latitude)) || isNaN(parseFloat(data.longitude))) {
    errors.push('Valid coordinates (latitude and longitude) are required.');
  }

  // Check required contact details
  const cleanName = sanitize(data.fullName || '');
  if (!cleanName || cleanName.length < 3 || cleanName.length > 100) {
    errors.push('Full name must be between 3 and 100 characters.');
  }

  if (!data.mobile || !/^\d{10}$/.test(data.mobile)) {
    errors.push('Mobile number must be exactly 10 digits.');
  }

  if (data.alternateMobile && !/^\d{10}$/.test(data.alternateMobile)) {
    errors.push('Alternative mobile number must be exactly 10 digits.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function getAddresses(req, res) {
  try {
    const userId = req.userId || 2; // Default mock user ID
    const addresses = await service.listAddressesService(userId);
    return res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    console.error('getAddresses error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function saveAddress(req, res) {
  try {
    const userId = req.userId || 2;
    const { isValid, errors } = validateAddressData(req.body);

    if (!isValid) {
      return res.status(400).json({ success: false, errors });
    }

    // Sanitize inputs
    const sanitizedData = {
      fullName: sanitize(req.body.fullName),
      mobile: sanitize(req.body.mobile),
      alternateMobile: sanitize(req.body.alternateMobile),
      houseNumber: sanitize(req.body.houseNumber),
      building: sanitize(req.body.building),
      street: sanitize(req.body.street),
      area: sanitize(req.body.area),
      landmark: sanitize(req.body.landmark),
      city: sanitize(req.body.city),
      state: sanitize(req.body.state),
      country: sanitize(req.body.country || 'India'),
      pincode: sanitize(req.body.pincode),
      latitude: parseFloat(req.body.latitude),
      longitude: parseFloat(req.body.longitude),
      formattedAddress: sanitize(req.body.formattedAddress),
      accuracy: sanitize(req.body.accuracy),
      verified: !!req.body.verified,
      addressType: sanitize(req.body.addressType || 'home'),
      isDefault: !!req.body.isDefault
    };

    const newAddress = await service.createAddressService(userId, sanitizedData);
    return res.status(201).json({ success: true, data: newAddress });
  } catch (error) {
    console.error('saveAddress error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function updateAddress(req, res) {
  try {
    const id = req.params.id;
    const userId = req.userId || 2;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid address ID.' });
    }

    const { isValid, errors } = validateAddressData(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, errors });
    }

    const sanitizedData = {
      fullName: sanitize(req.body.fullName),
      mobile: sanitize(req.body.mobile),
      alternateMobile: sanitize(req.body.alternateMobile),
      houseNumber: sanitize(req.body.houseNumber),
      building: sanitize(req.body.building),
      street: sanitize(req.body.street),
      area: sanitize(req.body.area),
      landmark: sanitize(req.body.landmark),
      city: sanitize(req.body.city),
      state: sanitize(req.body.state),
      country: sanitize(req.body.country || 'India'),
      pincode: sanitize(req.body.pincode),
      latitude: parseFloat(req.body.latitude),
      longitude: parseFloat(req.body.longitude),
      formattedAddress: sanitize(req.body.formattedAddress),
      accuracy: sanitize(req.body.accuracy),
      verified: !!req.body.verified,
      addressType: sanitize(req.body.addressType || 'home'),
      isDefault: !!req.body.isDefault
    };

    const updated = await service.updateAddressService(id, userId, sanitizedData);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Address not found or unauthorized.' });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('updateAddress error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function deleteAddress(req, res) {
  try {
    const id = req.params.id;
    const userId = req.userId || 2;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid address ID.' });
    }

    const deleted = await service.deleteAddressService(id, userId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Address not found or unauthorized.' });
    }

    return res.status(200).json({ success: true, message: 'Address deleted successfully.' });
  } catch (error) {
    console.error('deleteAddress error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

export async function makeDefault(req, res) {
  try {
    const id = req.params.id;
    const userId = req.userId || 2;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid address ID.' });
    }

    const updated = await service.makeDefaultAddressService(id, userId);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Address not found or unauthorized.' });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('makeDefault error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}

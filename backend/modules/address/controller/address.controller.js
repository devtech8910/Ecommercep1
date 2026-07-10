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
  if (!data.state || !sanitize(data.state)) errors.push('State is required.');
  if (!data.city || !sanitize(data.city)) errors.push('District is required.');
  if (!data.pincode || !sanitize(data.pincode)) errors.push('Pincode is required.');
  if (!data.area || !sanitize(data.area)) errors.push('Area / Locality / Village is required.');
  if (!data.street || !sanitize(data.street)) errors.push('Street name is required.');

  // Check required contact details
  const cleanName = sanitize(data.fullName || '');
  if (!cleanName) {
    errors.push('Full name is required.');
  }

  if (!data.mobile) {
    errors.push('Mobile number is required.');
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

    // Sanitize inputs and provide safe defaults for optional or missing fields
    const sanitizedData = {
      fullName: sanitize(req.body.fullName),
      mobile: sanitize(req.body.mobile),
      alternateMobile: sanitize(req.body.alternateMobile || ''),
      houseNumber: sanitize(req.body.houseNumber || 'N/A'),
      building: sanitize(req.body.building || ''),
      street: sanitize(req.body.street || 'Main Street'),
      area: sanitize(req.body.area || 'Local Area'),
      landmark: sanitize(req.body.landmark || ''),
      city: sanitize(req.body.city || 'City'),
      state: sanitize(req.body.state || 'State'),
      country: sanitize(req.body.country || 'India'),
      pincode: sanitize(req.body.pincode || '000000'),
      latitude: parseFloat(req.body.latitude) || 20.5937,
      longitude: parseFloat(req.body.longitude) || 78.9629,
      formattedAddress: sanitize(req.body.formattedAddress || ''),
      accuracy: sanitize(req.body.accuracy || 'ROOFTOP'),
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
      alternateMobile: sanitize(req.body.alternateMobile || ''),
      houseNumber: sanitize(req.body.houseNumber || 'N/A'),
      building: sanitize(req.body.building || ''),
      street: sanitize(req.body.street || 'Main Street'),
      area: sanitize(req.body.area || 'Local Area'),
      landmark: sanitize(req.body.landmark || ''),
      city: sanitize(req.body.city || 'City'),
      state: sanitize(req.body.state || 'State'),
      country: sanitize(req.body.country || 'India'),
      pincode: sanitize(req.body.pincode || '000000'),
      latitude: parseFloat(req.body.latitude) || 20.5937,
      longitude: parseFloat(req.body.longitude) || 78.9629,
      formattedAddress: sanitize(req.body.formattedAddress || ''),
      accuracy: sanitize(req.body.accuracy || 'ROOFTOP'),
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

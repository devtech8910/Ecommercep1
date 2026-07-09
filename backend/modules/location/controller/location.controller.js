import { forwardGeocode, reverseGeocode, autocompleteSearch } from '../service/geocoding.service.js';

export async function handleGeocode(req, res) {
  try {
    const { houseNumber, building, street, area, city, state, pincode, country } = req.body;

    if (!street && !area && !city && !state && !pincode) {
      return res.status(400).json({
        success: false,
        error: 'At least one location field (street, area, city, state, or pincode) must be provided for geocoding.'
      });
    }

    const result = await forwardGeocode({
      houseNumber,
      building,
      street,
      area,
      city,
      state,
      pincode,
      country
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Address could not be geocoded to matching coordinates.'
      });
    }

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Controller geocoding error:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while geocoding.'
    });
  }
}

export async function handleReverseGeocode(req, res) {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required in the request body.'
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude must be valid floating-point numbers.'
      });
    }

    const result = await reverseGeocode(lat, lon);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'No address matches the provided coordinates.'
      });
    }

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Controller reverse geocoding error:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while reverse geocoding.'
    });
  }
}

export async function handleAutocomplete(req, res) {
  try {
    const { query } = req.body;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query string is required for autocomplete.'
      });
    }

    const results = await autocompleteSearch(query);
    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Controller autocomplete error:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred while fetching autocomplete suggestions.'
    });
  }
}

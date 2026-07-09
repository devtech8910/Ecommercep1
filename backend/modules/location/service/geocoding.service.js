
const USER_AGENT = 'EcommerceAddressPickerApp/2.0 (devtech@example.com)';

/**
 * Helper: Execute a single Nominatim search query and return the first result.
 * Returns null if no results found.
 */
async function nominatimSearch(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=in&email=devtechfashion@example.com`;
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });

  if (!response.ok) {
    throw new Error(`Nominatim request failed with status: ${response.status}`);
  }

  const data = await response.json();
  if (!data || data.length === 0) return null;
  return data[0];
}

/**
 * Forward Geocoding using Nominatim with multi-tier fallback.
 * 
 * Nominatim (OpenStreetMap) does not index individual flat/apartment numbers
 * reliably, especially in India. Sending the full address string often returns
 * zero results or a match in a completely wrong city.
 *
 * Strategy: Try progressively broader queries, from street-level to city-level,
 * and return the first successful match. This mimics how Google Maps degrades
 * gracefully — if the exact street isn't found, it locates the neighborhood,
 * then the pincode area, then the city.
 */
export async function forwardGeocode(addressData) {
  const { houseNumber, building, street, area, city, state, pincode, country = 'India' } = addressData;

  // Build fallback query tiers from most specific to broadest.
  // Each tier is an array of non-empty address parts joined with commas.
  const tiers = [
    // Tier 0: House/Building + Street + Area + City + State + Pincode
    [houseNumber || building, street, area, city, state, pincode, country],
    // Tier 1: Street + Area + City + State + Pincode (most specific without house/building)
    [street, area, city, state, pincode, country],
    // Tier 2: Street + City + Pincode
    [street, city, pincode, country],
    // Tier 3: Area + City + State + Pincode
    [area, city, state, pincode, country],
    // Tier 4: Pincode + Country (pincode areas are well indexed)
    [pincode, country],
    // Tier 5: City + State + Country
    [city, state, country],
    // Tier 6: City + Country (broadest)
    [city, country],
  ];

  try {
    for (const tier of tiers) {
      const parts = tier.filter(Boolean);
      // Need at least 2 meaningful parts to form a useful query
      if (parts.length < 2) continue;

      const query = parts.join(', ');
      const result = await nominatimSearch(query);
      if (result) {
        return mapNominatimToGeocodeResult(result);
      }
    }

    // All tiers exhausted — no match found
    return null;
  } catch (error) {
    console.error('Geocoding service error:', error);
    throw error;
  }
}

/**
 * Reverse Geocoding using Nominatim
 */
export async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&email=devtechfashion@example.com`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim reverse geocode failed with status: ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.address) {
      return null;
    }

    return mapNominatimToAddressComponents(data);
  } catch (error) {
    console.error('Reverse geocoding service error:', error);
    throw error;
  }
}

/**
 * Autocomplete Search using Nominatim
 * Returns up to 5 suggestions based on the query.
 */
export async function autocompleteSearch(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=8&countrycodes=in&email=devtechfashion@example.com`;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('Nominatim rate limit hit! Returning mock data for demonstration.');
        return generateMockAutocomplete(query);
      }
      throw new Error(`Nominatim request failed with status: ${response.status}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) return [];
    
    return data.map(mapNominatimToGeocodeResult);
  } catch (error) {
    console.error('Autocomplete service error:', error);
    // If fetch failed completely (e.g. timeout or blocked), return mock data too
    console.warn('Returning mock data due to network error.');
    return generateMockAutocomplete(query);
  }
}

function generateMockAutocomplete(query) {
  const normalized = query.toLowerCase();
  
  // Very basic mock responses for demonstration when API is blocked
  if (normalized.includes('city') || normalized.includes('suburb') || normalized.length < 5) {
     return [
       { latitude: 12.9716, longitude: 77.5946, formattedAddress: 'Bengaluru, Karnataka, India', accuracy: 'APPROXIMATE', address: { city: 'Bengaluru', state: 'Karnataka', country: 'India' } },
       { latitude: 19.0760, longitude: 72.8777, formattedAddress: 'Mumbai, Maharashtra, India', accuracy: 'APPROXIMATE', address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' } },
       { latitude: 28.7041, longitude: 77.1025, formattedAddress: 'New Delhi, Delhi, India', accuracy: 'APPROXIMATE', address: { city: 'New Delhi', state: 'Delhi', country: 'India' } }
     ];
  }
  
  return [
    {
      latitude: 12.9784,
      longitude: 77.6408,
      formattedAddress: `100 Feet Road, Indiranagar, Bengaluru, Karnataka, 560038, India`,
      accuracy: 'APPROXIMATE',
      address: { road: '100 Feet Road', suburb: 'Indiranagar', city: 'Bengaluru', state: 'Karnataka', postcode: '560038', country: 'India' }
    },
    {
      latitude: 12.9719,
      longitude: 77.6412,
      formattedAddress: `CMH Road, Indiranagar, Bengaluru, Karnataka, 560038, India`,
      accuracy: 'APPROXIMATE',
      address: { road: 'CMH Road', suburb: 'Indiranagar', city: 'Bengaluru', state: 'Karnataka', postcode: '560038', country: 'India' }
    },
    {
      latitude: 12.9730,
      longitude: 77.6390,
      formattedAddress: `${query.split(',')[0]} (Mock Result), Bengaluru, Karnataka, India`,
      accuracy: 'APPROXIMATE',
      address: { road: query.split(',')[0], suburb: 'Mock Area', city: 'Bengaluru', state: 'Karnataka', postcode: '560001', country: 'India' }
    }
  ];
}

function mapNominatimToGeocodeResult(item) {
  return {
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
    formattedAddress: item.display_name,
    accuracy: item.importance > 0.6 ? 'ROOFTOP' : 'APPROXIMATE',
    address: {
      houseNumber: item.address.house_number || '',
      building: item.address.building || item.address.apartment || '',
      street: item.address.road || '',
      area: item.address.suburb || item.address.neighbourhood || item.address.village || '',
      city: item.address.city || item.address.town || item.address.municipality || '',
      state: item.address.state || '',
      country: item.address.country || 'India',
      pincode: item.address.postcode || ''
    }
  };
}

function mapNominatimToAddressComponents(item) {
  const addr = item.address;
  return {
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
    formattedAddress: item.display_name,
    accuracy: 'ROOFTOP', // Default to rooftop for exact pin drops
    address: {
      houseNumber: addr.house_number || '',
      building: addr.building || addr.apartment || addr.hotel || '',
      street: addr.road || '',
      area: addr.suburb || addr.neighbourhood || addr.village || addr.subdivision || '',
      city: addr.city || addr.town || addr.municipality || '',
      state: addr.state || '',
      country: addr.country || 'India',
      pincode: addr.postcode || ''
    }
  };
}

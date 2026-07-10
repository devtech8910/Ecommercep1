import { query } from '../../../db.js';

// Fallback seed data in case PG is not connected (for prototype local testing)
const seedData = {
    countries: [{ id: 1, name: 'India', code: 'IN', lat: 20.5937, lng: 78.9629 }],
    states: [
        { id: 1, country_id: 1, name: 'Andhra Pradesh', lat: 15.9129, lng: 79.7400 },
        { id: 2, country_id: 1, name: 'Arunachal Pradesh', lat: 28.2180, lng: 94.7278 },
        { id: 3, country_id: 1, name: 'Assam', lat: 26.2006, lng: 92.9376 },
        { id: 4, country_id: 1, name: 'Bihar', lat: 25.0961, lng: 85.3131 },
        { id: 5, country_id: 1, name: 'Chhattisgarh', lat: 21.2787, lng: 81.8661 },
        { id: 6, country_id: 1, name: 'Goa', lat: 15.2993, lng: 74.1240 },
        { id: 7, country_id: 1, name: 'Gujarat', lat: 22.2587, lng: 71.1924 },
        { id: 8, country_id: 1, name: 'Haryana', lat: 29.0588, lng: 76.0856 },
        { id: 9, country_id: 1, name: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
        { id: 10, country_id: 1, name: 'Jharkhand', lat: 23.6102, lng: 85.2799 },
        { id: 11, country_id: 1, name: 'Karnataka', lat: 15.3173, lng: 75.7139 },
        { id: 12, country_id: 1, name: 'Kerala', lat: 10.8505, lng: 76.2711 },
        { id: 13, country_id: 1, name: 'Madhya Pradesh', lat: 22.9734, lng: 78.6569 },
        { id: 14, country_id: 1, name: 'Maharashtra', lat: 19.7515, lng: 75.7139 },
        { id: 15, country_id: 1, name: 'Manipur', lat: 24.6637, lng: 93.9063 },
        { id: 16, country_id: 1, name: 'Meghalaya', lat: 25.4670, lng: 91.3662 },
        { id: 17, country_id: 1, name: 'Mizoram', lat: 23.1645, lng: 92.9376 },
        { id: 18, country_id: 1, name: 'Nagaland', lat: 26.1584, lng: 94.5624 },
        { id: 19, country_id: 1, name: 'Odisha', lat: 20.9517, lng: 85.0985 },
        { id: 20, country_id: 1, name: 'Punjab', lat: 31.1471, lng: 75.3412 },
        { id: 21, country_id: 1, name: 'Rajasthan', lat: 27.0238, lng: 74.2179 },
        { id: 22, country_id: 1, name: 'Sikkim', lat: 27.5330, lng: 88.5122 },
        { id: 23, country_id: 1, name: 'Tamil Nadu', lat: 11.1271, lng: 78.6569 },
        { id: 24, country_id: 1, name: 'Telangana', lat: 18.1124, lng: 79.0193 },
        { id: 25, country_id: 1, name: 'Tripura', lat: 23.9408, lng: 91.9882 },
        { id: 26, country_id: 1, name: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
        { id: 27, country_id: 1, name: 'Uttarakhand', lat: 30.0668, lng: 79.0193 },
        { id: 28, country_id: 1, name: 'West Bengal', lat: 22.9868, lng: 87.8550 },
        { id: 29, country_id: 1, name: 'Andaman and Nicobar Islands', lat: 11.7401, lng: 92.6586 },
        { id: 30, country_id: 1, name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
        { id: 31, country_id: 1, name: 'Dadra and Nagar Haveli and Daman and Diu', lat: 20.1809, lng: 73.0169 },
        { id: 32, country_id: 1, name: 'Delhi', lat: 28.7041, lng: 77.1025 },
        { id: 33, country_id: 1, name: 'Jammu and Kashmir', lat: 33.7782, lng: 76.5762 },
        { id: 34, country_id: 1, name: 'Ladakh', lat: 34.1526, lng: 77.5771 },
        { id: 35, country_id: 1, name: 'Lakshadweep', lat: 10.5667, lng: 72.6167 },
        { id: 36, country_id: 1, name: 'Puducherry', lat: 11.9416, lng: 79.8083 }
    ],
    cities: [
        { id: 1, state_id: 1, name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
        { id: 2, state_id: 1, name: 'Mysuru', lat: 12.2958, lng: 76.6394 },
        { id: 3, state_id: 2, name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
        { id: 4, state_id: 2, name: 'Pune', lat: 18.5204, lng: 73.8567 }
    ],
    areas: [
        { id: 1, city_id: 1, name: 'Indiranagar', pincode: '560038', lat: 12.9784, lng: 77.6408 },
        { id: 2, city_id: 1, name: 'Koramangala', pincode: '560034', lat: 12.9352, lng: 77.6245 },
        { id: 3, city_id: 1, name: 'Whitefield', pincode: '560066', lat: 12.9698, lng: 77.7499 },
        { id: 4, city_id: 3, name: 'Bandra West', pincode: '400050', lat: 19.0596, lng: 72.8295 }
    ],
    streets: [
        { id: 1, area_id: 1, name: '100 Feet Road', lat: 12.9784, lng: 77.6408 },
        { id: 2, area_id: 1, name: 'CMH Road', lat: 12.9719, lng: 77.6412 },
        { id: 3, area_id: 2, name: '80 Feet Road', lat: 12.9352, lng: 77.6245 },
        { id: 5, area_id: 4, name: 'Carter Road', lat: 19.0632, lng: 72.8236 }
    ]
};

async function executeQuery(sql, params, mockType, mockFilter) {
    try {
        const result = await query(sql, params);
        return result.rows;
    } catch (err) {
        if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED')) {
            console.warn(`[Mock Mode] PG unavailable. Simulating query for ${mockType}...`);
            let data = seedData[mockType] || [];
            if (mockFilter) {
                data = data.filter(mockFilter);
            }
            return data;
        }
        throw err;
    }
}

export async function getCountries() {
    return executeQuery('SELECT id, name, code, lat, lng FROM loc_countries ORDER BY name', [], 'countries');
}

export async function getStates(countryId) {
    return executeQuery(
        'SELECT id, name, lat, lng FROM loc_states WHERE country_id = $1 ORDER BY name',
        [countryId],
        'states',
        (s) => s.country_id === parseInt(countryId)
    );
}

export async function getCities(stateId) {
    if (!stateId || stateId === 'all') {
        return executeQuery(
            'SELECT id, name, lat, lng FROM loc_cities ORDER BY name',
            [],
            'cities'
        );
    }
    return executeQuery(
        'SELECT id, name, lat, lng FROM loc_cities WHERE state_id = $1 ORDER BY name',
        [stateId],
        'cities',
        (c) => c.state_id === parseInt(stateId)
    );
}

export async function getAreas(cityId) {
    return executeQuery(
        'SELECT id, name, pincode, lat, lng FROM loc_areas WHERE city_id = $1 ORDER BY name',
        [cityId],
        'areas',
        (a) => a.city_id === parseInt(cityId)
    );
}

export async function getStreets(areaId) {
    return executeQuery(
        'SELECT id, name, lat, lng FROM loc_streets WHERE area_id = $1 ORDER BY name',
        [areaId],
        'streets',
        (s) => s.area_id === parseInt(areaId)
    );
}

export async function searchLocation(type, context, searchQuery) {
    // Construct the live query
    let queryParts = [searchQuery];
    if (context.area) queryParts.push(context.area);
    if (context.city) queryParts.push(context.city);
    if (context.state) queryParts.push(context.state);
    queryParts.push('India');
    
    const fullQuery = queryParts.join(', ');
    
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullQuery)}&format=json&addressdetails=1&limit=10&countrycodes=in&email=devtechfashion@example.com`;
        const response = await fetch(url, { headers: { 'User-Agent': 'EcommerceAddressPickerApp/2.0' } });
        
        if (!response.ok) {
            return executeFallbackSearch(type, context, searchQuery);
        }
        
        const data = await response.json();
        
        // Map to LocationEntity structure expected by frontend
        const results = data.map((item, index) => {
            let entityName = item.display_name.split(',')[0]; // Good fallback
            
            if (item.address) {
                if (type === 'city') entityName = item.address.city || item.address.town || item.address.municipality || entityName;
                if (type === 'area') entityName = item.address.suburb || item.address.neighbourhood || item.address.village || entityName;
                if (type === 'street') entityName = item.address.road || entityName;
            }
            
            return {
                id: item.place_id || Date.now() + index,
                name: entityName,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                pincode: item.address?.postcode || ''
            };
        });
        
        // Remove duplicates by name
        return results.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
    } catch (err) {
        console.warn('Nominatim live search failed, falling back to mock database', err);
        return executeFallbackSearch(type, context, searchQuery);
    }
}

function executeFallbackSearch(type, context, searchQuery) {
    const searchParam = searchQuery.toLowerCase();
    const mockMap = { state: 'states', city: 'cities', area: 'areas', street: 'streets' };
    const mockType = mockMap[type];
    
    return (seedData[mockType] || []).filter(x => x.name.toLowerCase().includes(searchParam));
}

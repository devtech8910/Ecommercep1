import * as HierarchyService from '../service/hierarchy.service.js';

export async function getCountries(req, res) {
    try {
        const countries = await HierarchyService.getCountries();
        res.status(200).json({ success: true, data: countries });
    } catch (err) {
        console.error('getCountries error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch countries' });
    }
}

export async function getStates(req, res) {
    try {
        const { countryId } = req.query;
        if (!countryId) return res.status(400).json({ success: false, error: 'countryId is required' });
        
        const states = await HierarchyService.getStates(countryId);
        res.status(200).json({ success: true, data: states });
    } catch (err) {
        console.error('getStates error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch states' });
    }
}

export async function getCities(req, res) {
    try {
        const { stateId } = req.query;
        if (!stateId) return res.status(400).json({ success: false, error: 'stateId is required' });
        
        const cities = await HierarchyService.getCities(stateId);
        res.status(200).json({ success: true, data: cities });
    } catch (err) {
        console.error('getCities error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch cities' });
    }
}

export async function getAreas(req, res) {
    try {
        const { cityId } = req.query;
        if (!cityId) return res.status(400).json({ success: false, error: 'cityId is required' });
        
        const areas = await HierarchyService.getAreas(cityId);
        res.status(200).json({ success: true, data: areas });
    } catch (err) {
        console.error('getAreas error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch areas' });
    }
}

export async function getStreets(req, res) {
    try {
        const { areaId } = req.query;
        if (!areaId) return res.status(400).json({ success: false, error: 'areaId is required' });
        
        const streets = await HierarchyService.getStreets(areaId);
        res.status(200).json({ success: true, data: streets });
    } catch (err) {
        console.error('getStreets error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch streets' });
    }
}

export async function searchLocation(req, res) {
    try {
        const { type } = req.params; // 'state', 'city', 'area', 'street'
        const { query, state, city, area } = req.query;
        
        if (!['state', 'city', 'area', 'street'].includes(type)) {
            return res.status(400).json({ success: false, error: 'Invalid search type' });
        }
        if (!query) return res.status(400).json({ success: false, error: 'query is required' });
        
        const context = { state, city, area };
        const results = await HierarchyService.searchLocation(type, context, query);
        res.status(200).json({ success: true, data: results });
    } catch (err) {
        console.error('searchLocation error:', err);
        res.status(500).json({ success: false, error: 'Failed to search locations' });
    }
}

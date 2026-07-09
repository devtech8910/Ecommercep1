import { Router } from 'express';
import { handleGeocode, handleReverseGeocode, handleAutocomplete } from '../controller/location.controller.js';

import * as HierarchyController from '../controller/hierarchy.controller.js';

const router = Router();

// Legacy Endpoints
router.post('/geocode', handleGeocode);
router.post('/reverse', handleReverseGeocode);
router.post('/autocomplete', handleAutocomplete);

// Hierarchy Endpoints
router.get('/hierarchy/countries', HierarchyController.getCountries);
router.get('/hierarchy/states', HierarchyController.getStates);
router.get('/hierarchy/cities', HierarchyController.getCities);
router.get('/hierarchy/areas', HierarchyController.getAreas);
router.get('/hierarchy/streets', HierarchyController.getStreets);
router.get('/hierarchy/search/:type', HierarchyController.searchLocation);

export default router;

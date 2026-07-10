import type { GeocodeResult, ReverseGeocodeResult, AddressFormData } from '../types/location.types';

const API_BASE_URL = 'http://localhost:5000/location';

export interface LocationEntity {
  id: number;
  name: string;
  lat: number;
  lng: number;
  code?: string;
  pincode?: string;
}

export const LocationService = {
  // Legacy methods (can be adapted or kept for map pins)
  async geocode(address: Partial<AddressFormData>): Promise<GeocodeResult | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });
      if (!response.ok) return null;
      const json = await response.json();
      return json.success ? json.data : null;
    } catch (error) {
      console.error('Geocoder error:', error);
      return null;
    }
  },

  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      if (!response.ok) return null;
      const json = await response.json();
      return json.success ? json.data : null;
    } catch (error) {
      console.error('ReverseGeocoder error:', error);
      return null;
    }
  },

  // Strict Hierarchy Methods
  async fetchCountries(): Promise<LocationEntity[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/hierarchy/countries`);
      if (!response.ok) return [];
      const json = await response.json();
      return json.success ? json.data : [];
    } catch (error) {
      console.error('Fetch countries error:', error);
      return [];
    }
  },

  async fetchStates(countryId: number): Promise<LocationEntity[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/hierarchy/states?countryId=${countryId}`);
      if (!response.ok) return [];
      const json = await response.json();
      return json.success ? json.data : [];
    } catch (error) {
      console.error('Fetch states error:', error);
      return [];
    }
  },

  async fetchCities(stateId?: number | string): Promise<LocationEntity[]> {
    try {
      const url = stateId 
        ? `${API_BASE_URL}/hierarchy/cities?stateId=${stateId}` 
        : `${API_BASE_URL}/hierarchy/cities`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const json = await response.json();
      return json.success ? json.data : [];
    } catch (error) {
      console.error('Fetch cities error:', error);
      return [];
    }
  },

  async fetchAreas(cityId: number): Promise<LocationEntity[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/hierarchy/areas?cityId=${cityId}`);
      if (!response.ok) return [];
      const json = await response.json();
      return json.success ? json.data : [];
    } catch (error) {
      console.error('Fetch areas error:', error);
      return [];
    }
  },

  async fetchStreets(areaId: number): Promise<LocationEntity[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/hierarchy/streets?areaId=${areaId}`);
      if (!response.ok) return [];
      const json = await response.json();
      return json.success ? json.data : [];
    } catch (error) {
      console.error('Fetch streets error:', error);
      return [];
    }
  },

  async searchHierarchy(type: 'state' | 'city' | 'area' | 'street', context: any, query: string, signal?: AbortSignal): Promise<LocationEntity[]> {
    try {
      const qs = new URLSearchParams();
      qs.append('query', query);
      if (context.state) qs.append('state', context.state);
      if (context.city) qs.append('city', context.city);
      if (context.area) qs.append('area', context.area);

      const response = await fetch(`${API_BASE_URL}/hierarchy/search/${type}?${qs.toString()}`, { signal });
      if (!response.ok) return [];
      const json = await response.json();
      return json.success ? json.data : [];
    } catch (error: any) {
      if (error.name === 'AbortError') {
         console.log('Search aborted');
      } else {
         console.error('Search hierarchy error:', error);
      }
      return [];
    }
  },

  async fetchPincodesForCity(city: string, signal?: AbortSignal): Promise<LocationEntity[]> {
    if (!city) return [];
    try {
      const response = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(city)}`, { signal });
      if (!response.ok) return [];
      const json = await response.json();
      
      if (json && json[0] && json[0].Status === 'Success' && json[0].PostOffice) {
        // Map post offices to LocationEntity, grouping by Pincode or returning each PO as an option
        const postOffices = json[0].PostOffice;
        
        // Return unique pincodes or a list of POs with their pincodes
        return postOffices.map((po: any, index: number) => ({
          id: Date.now() + index,
          name: po.Pincode, 
          code: po.Name, // Using code for the Post Office Name to display it
          pincode: po.Pincode,
          lat: 0,
          lng: 0
        })).filter((v: any, i: number, a: any[]) => a.findIndex(t => t.name === v.name) === i); // Unique pincodes
      }
      return [];
    } catch (error: any) {
      if (error.name !== 'AbortError') {
         console.error('Fetch pincodes error:', error);
      }
      return [];
    }
  }
};

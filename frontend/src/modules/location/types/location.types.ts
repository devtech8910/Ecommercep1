export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  mobile: string;
  alternateMobile?: string;
  houseNumber: string;
  building?: string;
  street: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  accuracy?: string;
  verified: boolean;
  addressType: 'home' | 'work';
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddressFormData {
  fullName: string;
  mobile: string;
  alternateMobile?: string;
  houseNumber: string;
  building: string;
  street: string;
  area: string;
  landmark: string;
  countryId?: number;
  stateId?: number;
  cityId?: number;
  areaId?: number;
  streetId?: number;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  addressType: 'home' | 'work';
  isDefault: boolean;
}

export interface ReverseGeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  accuracy: string;
  address: {
    houseNumber: string;
    building: string;
    street: string;
    area: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  accuracy: string;
  address: {
    houseNumber: string;
    building: string;
    street: string;
    area: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type DistanceStatus = 'at_location' | 'nearby' | 'away';

export interface DistanceValidation {
  status: DistanceStatus;
  message: string;
  distance: number;
}

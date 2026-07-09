import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { LocationService } from '../services/locationService';
import type { LocationEntity } from '../services/locationService';
import { MapPicker } from './MapPicker';
import { DistanceAlert } from './DistanceAlert';
import { AccuracyBadge } from './AccuracyBadge';
import type { AddressFormData, Coordinates } from '../types/location.types';
import { calculateDistance } from '../utils/distance';
import { AutocompleteInput } from './AutocompleteInput';

interface AddressFormProps {
  initialData?: Partial<AddressFormData>;
  gpsCoords: Coordinates | null;
  onSubmit: (data: AddressFormData) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  formMode?: 'gps' | 'away';
}

export const AddressForm: React.FC<AddressFormProps> = ({
  initialData,
  gpsCoords,
  onSubmit,
  onCancel,
  submitting = false,
  formMode = 'away'
}) => {
  const [mapCenter, setMapCenter] = useState<Coordinates>(
    gpsCoords || { lat: 20.5937, lng: 78.9629 }
  );
  const [accuracy, setAccuracy] = useState<string>('APPROXIMATE');
  const [isAway, setIsAway] = useState(false);
  
  // Rule 1, 2, 11: Relational State
  const [countries, setCountries] = useState<LocationEntity[]>([]);
  const [states, setStates] = useState<LocationEntity[]>([]);

  useEffect(() => {
    if (!gpsCoords) {
      setIsAway(true);
      return;
    }
    const dist = calculateDistance(gpsCoords.lat, gpsCoords.lng, mapCenter.lat, mapCenter.lng);
    setIsAway(dist > 100);
  }, [gpsCoords, mapCenter]);

  // Load initial countries
  useEffect(() => {
    LocationService.fetchCountries().then(setCountries);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors }
  } = useForm<AddressFormData>({
    defaultValues: {
      fullName: '',
      mobile: '',
      houseNumber: '',
      building: '',
      street: '',
      area: '',
      landmark: '',
      city: '',
      state: '',
      country: 'India',
      countryId: 1, // Default India ID
      pincode: '',
      latitude: mapCenter.lat,
      longitude: mapCenter.lng,
      addressType: 'home',
      isDefault: false,
      ...initialData
    }
  });

  const watchedCountryId = watch('countryId');
  const watchedStateId = watch('stateId');
  const watchedCityId = watch('cityId');
  const watchedAreaId = watch('areaId');
  const watchedStreetId = watch('streetId');
  
  const watchedState = watch('state');
  const watchedCity = watch('city');
  const watchedArea = watch('area');
  const watchedStreet = watch('street');
  const watchedHouse = watch('houseNumber');
  const watchedBuilding = watch('building');
  const watchedPin = watch('pincode');

  // Fetch states when country changes
  useEffect(() => {
    if (watchedCountryId) {
      LocationService.fetchStates(watchedCountryId).then(setStates);
    } else {
      setStates([]);
    }
  }, [watchedCountryId]);

  // Smart Map Update for Pincode
  useEffect(() => {
    if (watchedPin && watchedPin.length === 6) {
      LocationService.geocode({ pincode: watchedPin, city: watchedCity, state: watchedState, country: 'India' })
        .then((res) => {
          if (res) {
            setMapCenter({ lat: res.latitude, lng: res.longitude });
          }
        });
    }
  }, [watchedPin, watchedCity, watchedState]);

  // Smart Map Update for House Number
  useEffect(() => {
    if (!watchedHouse || watchedHouse.length < 2) return;
    const timeout = setTimeout(() => {
      LocationService.geocode({ 
         houseNumber: watchedHouse, 
         street: watchedStreet, 
         area: watchedArea, 
         city: watchedCity, 
         state: watchedState, 
         pincode: watchedPin, 
         country: 'India' 
      }).then((res) => {
        if (res) {
          setMapCenter({ lat: res.latitude, lng: res.longitude });
        }
      });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [watchedHouse, watchedStreet, watchedArea, watchedCity, watchedState, watchedPin]);

  // Rule 6: Reset child fields when parent changes
  const resetCityAndBelow = useCallback(() => {
    setValue('city', '');
    setValue('cityId', undefined);
    setValue('area', '');
    setValue('areaId', undefined);
    setValue('street', '');
    setValue('streetId', undefined);
    setValue('pincode', '');
  }, [setValue]);

  const resetAreaAndBelow = useCallback(() => {
    setValue('area', '');
    setValue('areaId', undefined);
    setValue('street', '');
    setValue('streetId', undefined);
    setValue('pincode', '');
  }, [setValue]);

  const resetStreetAndBelow = useCallback(() => {
    setValue('street', '');
    setValue('streetId', undefined);
  }, [setValue]);

  // State selection handler
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateIdStr = e.target.value;
    const st = states.find(s => s.id.toString() === stateIdStr);
    
    // Rule 6: Clear all children
    resetCityAndBelow();
    
    if (st) {
      setValue('stateId', st.id);
      setValue('state', st.name);
      setMapCenter({ lat: st.lat, lng: st.lng });
      setValue('latitude', st.lat);
      setValue('longitude', st.lng);
    } else {
      setValue('stateId', undefined);
      setValue('state', '');
    }
  };

  const handleCitySelect = (entity: LocationEntity) => {
    if (watchedCityId !== entity.id) resetAreaAndBelow();
    setValue('cityId', entity.id);
    setMapCenter({ lat: entity.lat, lng: entity.lng });
    setValue('latitude', entity.lat);
    setValue('longitude', entity.lng);
  };

  const handleAreaSelect = (entity: LocationEntity) => {
    if (watchedAreaId !== entity.id) resetStreetAndBelow();
    setValue('areaId', entity.id);
    if (entity.pincode) setValue('pincode', entity.pincode);
    setMapCenter({ lat: entity.lat, lng: entity.lng });
    setValue('latitude', entity.lat);
    setValue('longitude', entity.lng);
  };

  const handleStreetSelect = (entity: LocationEntity) => {
    setValue('streetId', entity.id);
    setMapCenter({ lat: entity.lat, lng: entity.lng });
    setValue('latitude', entity.lat);
    setValue('longitude', entity.lng);
  };

  // Rule 15: Delivery Validation
  const onSubmitHandler = async (data: AddressFormData) => {
    // Strict validation
    if (!data.countryId || !data.stateId || !data.cityId || !data.areaId || !data.streetId) {
      alert("Invalid hierarchy. Please select valid locations from the suggestions dropdowns.");
      return;
    }
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4 text-slate-800">
      {formMode === 'gps' ? (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-indigo-600/5 border border-indigo-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-widest">
                📍 Current Location (Converted to Text)
              </h4>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded font-semibold">
                Resolved via GPS
              </span>
            </div>
            
            <div className="space-y-1 text-slate-800">
              <p className="text-sm font-bold text-slate-900">
                {[watchedHouse, watchedBuilding].filter(Boolean).join(', ') || 'House details not detected'}
              </p>
              <p className="text-xs text-slate-600 font-semibold">
                {[watchedStreet, watchedArea].filter(Boolean).join(', ') || 'Street details not detected'}
              </p>
              <p className="text-xs text-slate-500 font-semibold">
                {watchedCity}, {watchedState} - {watchedPin}
              </p>
            </div>

            <div style={{ pointerEvents: 'none', opacity: 0.85 }}>
              <MapPicker center={mapCenter} onLocationChange={() => {}} />
            </div>
            <AccuracyBadge accuracy={accuracy} />
          </div>
        </div>
      ) : (
        <>
          {isAway && (
            <div className="p-4 rounded-xl bg-indigo-600/5 border border-indigo-600/20 text-xs text-indigo-700 flex items-start gap-2.5">
              <span className="text-base leading-none">💡</span>
              <div>
                <p className="font-bold mb-0.5">Strict Location Entry</p>
                <p className="text-slate-500 font-medium">Please select your exact delivery location from the verified dropdown suggestions. The map will update automatically.</p>
              </div>
            </div>
          )}

          {/* ── Address Fields ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Country
              </label>
              <select
                {...register('countryId', { required: 'Country is required.' })}
                className="w-full bg-black/10 border border-black/10 rounded-xl px-4 py-3 text-sm text-slate-500 outline-none cursor-not-allowed"
                disabled
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                State *
              </label>
              <select
                value={watchedStateId || ''}
                onChange={handleStateChange}
                className={`w-full bg-black/5 border rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-600 focus:bg-white
                  ${errors.stateId ? 'border-red-500/50 bg-red-500/5' : 'border-black/10'}`}
              >
                <option value="">Select State</option>
                {states.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
              {errors.stateId && (
                <p className="text-xs text-red-600 mt-1">Please select a State.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AutocompleteInput
              label="City *"
              placeholder="e.g. Bengaluru"
              value={watchedCity}
              disabled={!watchedStateId}
              error={errors.cityId ? "Please select a valid City from suggestions." : undefined}
              registerProps={register('city', { required: true })}
              onChange={(val) => setValue('city', val)}
              onSelect={handleCitySelect}
              fetchSuggestions={(q, signal) => LocationService.searchHierarchy('city', { state: watchedState }, q, signal)}
            />
            <div>
              <AutocompleteInput
                label="Pin Code *"
                placeholder="e.g. 560038"
                value={watchedPin}
                disabled={!watchedCityId}
                error={errors.pincode?.message}
                registerProps={register('pincode', {
                  required: 'PIN code is required.',
                  pattern: { value: /^\d{6}$/, message: 'Must be a 6-digit number.' }
                })}
                onChange={(val) => setValue('pincode', val)}
                onSelect={(entity) => setValue('pincode', entity.pincode || entity.name)}
                fetchSuggestions={async (q, signal) => {
                  const results = await LocationService.fetchPincodesForCity(watchedCity, signal);
                  // Filter client-side based on what they're typing
                  return results.filter(r => r.name.includes(q));
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AutocompleteInput
              label="Area/Locality/Village *"
              placeholder="e.g. Indiranagar"
              value={watchedArea}
              disabled={!watchedCityId}
              error={errors.areaId ? "Please select a valid Area from suggestions." : undefined}
              registerProps={register('area', { required: true })}
              onChange={(val) => setValue('area', val)}
              onSelect={handleAreaSelect}
              fetchSuggestions={(q, signal) => LocationService.searchHierarchy('area', { state: watchedState, city: watchedCity }, q, signal)}
            />
            <AutocompleteInput
              label="Street Name/Road *"
              placeholder="e.g. 100 Feet Road"
              value={watchedStreet}
              disabled={!watchedAreaId}
              error={errors.streetId ? "Please select a valid Street from suggestions." : undefined}
              registerProps={register('street', { required: true })}
              onChange={(val) => setValue('street', val)}
              onSelect={handleStreetSelect}
              fetchSuggestions={(q, signal) => LocationService.searchHierarchy('street', { state: watchedState, city: watchedCity, area: watchedArea }, q, signal)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                House/Flat Number *
              </label>
              <input
                type="text"
                {...register('houseNumber', { required: 'House/Flat number is required.' })}
                disabled={!watchedStreetId}
                className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-black/30 outline-none transition-all
                  ${!watchedStreetId ? 'bg-black/10 cursor-not-allowed opacity-60' : 'bg-black/5 focus:border-indigo-600 focus:bg-white'}
                  ${errors.houseNumber ? 'border-red-500/50 bg-red-500/5' : 'border-black/10'}`}
                placeholder="e.g. Flat 402 / D-12"
              />
              {errors.houseNumber && (
                <p className="text-xs text-red-600 mt-1">{errors.houseNumber.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Apartment/Building Name (Optional)
              </label>
              <input
                type="text"
                {...register('building')}
                disabled={!watchedStreetId}
                className={`w-full border border-black/10 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-black/30 outline-none transition-all
                  ${!watchedStreetId ? 'bg-black/10 cursor-not-allowed opacity-60' : 'bg-black/5 focus:border-indigo-600 focus:bg-white'}`}
                placeholder="e.g. Signature Towers"
              />
            </div>
          </div>
          
          <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Landmark (Optional)
              </label>
              <input
                type="text"
                {...register('landmark')}
                disabled={!watchedStreetId}
                className={`w-full border border-black/10 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-black/30 outline-none transition-all
                  ${!watchedStreetId ? 'bg-black/10 cursor-not-allowed opacity-60' : 'bg-black/5 focus:border-indigo-600 focus:bg-white'}`}
                placeholder="e.g. Near Metro Station"
              />
          </div>

          {/* ── Mini Map Container ── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Confirm Location on Map
              </label>
            </div>
            {/* Disabled manual map marker repositioning to enforce strict hierarchical location picking */}
            <MapPicker center={mapCenter} onLocationChange={() => {}} />
            <AccuracyBadge accuracy={accuracy} />
            <DistanceAlert gpsCoords={gpsCoords} markerCoords={mapCenter} />
          </div>
        </>
      )}

      {/* ── Contact Details ──────────────────────────── */}
      <div className="border-t border-black/5 pt-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Contact Information
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              {...register('fullName', {
                required: 'Full name is required.',
                minLength: { value: 3, message: 'Minimum 3 characters.' },
                maxLength: { value: 100, message: 'Maximum 100 characters.' }
              })}
              className={`w-full bg-black/5 border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-black/30 outline-none transition-all focus:border-indigo-600 focus:bg-white
                ${errors.fullName ? 'border-red-500/50 bg-red-500/5' : 'border-black/10'}`}
              placeholder="e.g. Purna Sai"
            />
            {errors.fullName && (
              <p className="text-xs text-red-600 mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Mobile Number *
            </label>
            <input
              type="tel"
              maxLength={10}
              {...register('mobile', {
                required: 'Mobile number is required.',
                pattern: { value: /^\d{10}$/, message: 'Must be exactly 10 digits.' }
              })}
              className={`w-full bg-black/5 border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-black/30 outline-none transition-all focus:border-indigo-600 focus:bg-white
                ${errors.mobile ? 'border-red-500/50 bg-red-500/5' : 'border-black/10'}`}
              placeholder="98765 43210"
            />
            {errors.mobile && (
              <p className="text-xs text-red-600 mt-1">{errors.mobile.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Alternative Mobile Number
            </label>
            <input
              type="tel"
              maxLength={10}
              {...register('alternateMobile', {
                pattern: { value: /^\d{10}$/, message: 'Must be exactly 10 digits.' }
              })}
              className={`w-full bg-black/5 border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-black/30 outline-none transition-all focus:border-indigo-600 focus:bg-white
                ${errors.alternateMobile ? 'border-red-500/50 bg-red-500/5' : 'border-black/10'}`}
              placeholder="e.g. 98765 11111"
            />
            {errors.alternateMobile && (
              <p className="text-xs text-red-600 mt-1">{errors.alternateMobile.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Address Type & Default Options ──────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-black/5 pt-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Save Address As
          </label>
          <div className="flex gap-2">
            <Controller
              name="addressType"
              control={control}
              render={({ field }) => (
                <>
                  <button
                    type="button"
                    onClick={() => field.onChange('home')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border
                      ${field.value === 'home'
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-black/5 border-black/10 text-slate-600 hover:bg-black/10'
                      }`}
                  >
                    🏠 Home
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange('work')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border
                      ${field.value === 'work'
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-black/5 border-black/10 text-slate-600 hover:bg-black/10'
                      }`}
                  >
                    💼 Work
                  </button>
                </>
              )}
            />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer group mt-4 md:mt-6">
          <input
            type="checkbox"
            {...register('isDefault')}
            className="w-4 h-4 rounded border-black/20 bg-black/5 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
            Set as default delivery address
          </span>
        </label>
      </div>

      {/* ── Action Buttons ──────────────────────────────────────── */}
      <div className="flex gap-3 pt-4 border-t border-black/5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-black/10 text-sm text-slate-600 hover:text-slate-900 hover:border-black/30 hover:bg-black/5 transition-all font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all
            ${submitting
              ? 'bg-indigo-700/50 cursor-wait'
              : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/30'
            }`}
        >
          {submitting ? 'Saving Address…' : 'Save Address'}
        </button>
      </div>
    </form>
  );
};

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MapPicker } from './MapPicker';
import type { AddressFormData, Coordinates } from '../types/location.types';

interface AddressFormProps {
  mode: 'gps' | 'away';
  gpsCoords?: { lat: number; lng: number } | null;
  gpsAddress?: {
    formattedAddress: string;
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
  } | null;
  initialData?: Partial<AddressFormData>;
  onSubmit: (data: AddressFormData) => Promise<void>;
  onCancel: () => void;
}

export const AddressForm = ({
  mode,
  gpsCoords,
  gpsAddress,
  initialData,
  onSubmit,
  onCancel
}: AddressFormProps) => {
  // Map preview coordinates (for GPS mode)
  const [mapCenter, setMapCenter] = useState<Coordinates>(
    gpsCoords || (initialData?.latitude && initialData?.longitude 
      ? { lat: initialData.latitude, lng: initialData.longitude } 
      : { lat: 20.5937, lng: 78.9629 }) // India center
  );

  // States & Districts JSON Dataset State
  const [statesData, setStatesData] = useState<Record<string, string[]>>({});
  const [loadingDataset, setLoadingDataset] = useState(true);

  // India Post PIN Code states
  const [postOffices, setPostOffices] = useState<string[]>([]);
  const [loadingPincode, setLoadingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState('');

  // GPS auto-prefill tracker
  const [gpsPrefilled, setGpsPrefilled] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<AddressFormData>({
    defaultValues: {
      fullName: '',
      mobile: '',
      alternateMobile: '',
      houseNumber: '',
      building: '',
      street: '',
      area: '',
      landmark: '',
      city: '',
      state: '',
      country: 'India',
      countryId: 1,
      pincode: '',
      latitude: mapCenter.lat,
      longitude: mapCenter.lng,
      addressType: 'home',
      isDefault: false,
      ...initialData
    }
  });

  const watchedState = watch('state');
  const watchedCity = watch('city');
  const watchedPincode = watch('pincode');
  const watchedAddressType = watch('addressType');

  // Load States and Districts dataset dynamically from GitHub source URL
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json')
      .then((res) => {
        if (!res.ok) throw new Error('Network response not ok');
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.states)) {
          const mapped: Record<string, string[]> = {};
          data.states.forEach((item: any) => {
            if (item.state && Array.isArray(item.districts)) {
              mapped[item.state] = item.districts;
            }
          });
          setStatesData(mapped);
        } else if (data && typeof data === 'object') {
          setStatesData(data);
        }
        setLoadingDataset(false);
      })
      .catch((err) => {
        console.error('Failed to dynamically fetch states-and-districts JSON:', err);
        setLoadingDataset(false);
      });
  }, []);

  // Update map coordinates in GPS mode when props change
  useEffect(() => {
    if (mode === 'gps' && gpsCoords) {
      setMapCenter(gpsCoords);
      setValue('latitude', gpsCoords.lat);
      setValue('longitude', gpsCoords.lng);
    }
  }, [mode, gpsCoords, setValue]);

  // Automatically prefill detected GPS location fields once statesData loads
  useEffect(() => {
    if (mode === 'gps' && gpsAddress && !loadingDataset && !gpsPrefilled) {
      const state = gpsAddress.address.state;
      const district = gpsAddress.address.city;
      const pincode = gpsAddress.address.pincode;
      const area = gpsAddress.address.area;
      const street = gpsAddress.address.street;

      // 4. After detecting the State, call populateDistricts(state) to populate the District dropdown
      const populateDistricts = (stateName: string) => {
        if (!stateName) return;
        const matchedState = Object.keys(statesData).find(
          (s) => s.toLowerCase() === stateName.toLowerCase()
        );
        if (matchedState) {
          setValue('state', matchedState);
        } else {
          setValue('state', stateName);
        }
      };

      // 5. Automatically set the form values only in GPS mode
      setValue('state', state);
      populateDistricts(state);

      // Set detected district value in dropdown
      const matchedState = Object.keys(statesData).find(
        (s) => s.toLowerCase() === state.toLowerCase()
      );
      if (matchedState && district) {
        const stateDistricts = statesData[matchedState] || [];
        let matchedDistrict = stateDistricts.find(
          (d) => d.toLowerCase() === district.toLowerCase()
        );
        if (!matchedDistrict) {
          matchedDistrict = stateDistricts.find(
            (d) => d.toLowerCase().includes(district.toLowerCase()) || 
                   district.toLowerCase().includes(d.toLowerCase())
          );
        }

        if (matchedDistrict) {
          setValue('city', matchedDistrict);
          setValue('district' as any, matchedDistrict);
        } else {
          setStatesData((prev) => ({
            ...prev,
            [matchedState]: [...(prev[matchedState] || []), district]
          }));
          setValue('city', district);
          setValue('district' as any, district);
        }
      } else {
        setValue('city', district);
        setValue('district' as any, district);
      }

      setValue('pincode', pincode);
      setValue('area', area);
      setValue('street', street);

      if (gpsAddress.address.houseNumber) {
        setValue('houseNumber', gpsAddress.address.houseNumber);
      }
      if (gpsAddress.address.building) {
        setValue('building', gpsAddress.address.building);
      }

      setGpsPrefilled(true);
    }
  }, [mode, gpsAddress, loadingDataset, gpsPrefilled, statesData, setValue]);


  // Handle Form Submission
  const onFormSubmit = async (data: AddressFormData) => {
    data.latitude = mapCenter.lat;
    data.longitude = mapCenter.lng;
    await onSubmit(data);
  };

  // State Change handler to reset District
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedState = e.target.value;
    setValue('state', selectedState);
    setValue('city', ''); // Reset district selection to empty (Select District)
  };

  // Pincode API matcher
  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Numeric only
    setValue('pincode', val);
    setPincodeError('');

    if (val.length === 6) {
      setLoadingPincode(true);
      fetch(`https://api.postalpincode.in/pincode/${val}`)
        .then((res) => {
          if (!res.ok) throw new Error('API fetch failed');
          return res.json();
        })
        .then((data) => {
          setLoadingPincode(false);
          if (data && data[0] && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice)) {
            const list = data[0].PostOffice;
            const stateFromApi = list[0].State;
            const districtFromApi = list[0].District;

            // 1. Match State case-insensitively
            const matchedState = stateNames.find((st) => st.toLowerCase() === stateFromApi.toLowerCase());
            if (matchedState) {
              setValue('state', matchedState);

              // 2. Match District case-insensitively or substring
              const stateDistricts = statesData[matchedState] || [];
              let matchedDistrict = stateDistricts.find(
                (d) => d.toLowerCase() === districtFromApi.toLowerCase()
              );
              if (!matchedDistrict) {
                // Substring match
                matchedDistrict = stateDistricts.find(
                  (d) => d.toLowerCase().includes(districtFromApi.toLowerCase()) || 
                         districtFromApi.toLowerCase().includes(d.toLowerCase())
                );
              }

              // Set district values
              if (matchedDistrict) {
                setValue('city', matchedDistrict);
              } else {
                setStatesData((prev) => ({
                  ...prev,
                  [matchedState]: [...(prev[matchedState] || []), districtFromApi]
                }));
                setValue('city', districtFromApi);
              }
            }

            // 3. Set Post Offices
            const poNames = list.map((po: any) => po.Name).sort();
            setPostOffices(poNames);
            if (poNames.length === 1) {
              setValue('area', poNames[0]);
            } else {
              setValue('area', ''); // User must choose
            }
          } else {
            setPincodeError('No post offices found for this PIN code.');
            setPostOffices([]);
          }
        })
        .catch((err) => {
          setLoadingPincode(false);
          console.error(err);
          setPincodeError('Error fetching PIN code details. Please try again.');
          setPostOffices([]);
        });
    } else {
      setPostOffices([]);
    }
  };

  // Extract keys representing state names sorted alphabetically
  const stateNames = Object.keys(statesData).sort();
  const districtList = watchedState ? statesData[watchedState] || [] : [];

  // Determine if auto-detected GPS location is missing District or Pincode
  const showDetectedWarning = mode === 'gps' && gpsAddress && (!gpsAddress.address.city || !gpsAddress.address.pincode);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} style={{ padding: '4px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* ── MAP CONTAINER (GPS Mode Only) ── */}
      {mode === 'gps' && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', display: 'block', marginBottom: '8px' }}>
            📍 Location Preview (Map)
          </label>
          <div style={{ height: '200px', borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #e5e7eb' }}>
            <MapPicker
              center={mapCenter}
              onLocationChange={() => {}}
              height={200}
              interactive={false}
            />
          </div>
        </div>
      )}

      {/* ── GPS RESOLVED ADDRESS DETAILS (SCRIPT) ── */}
      {mode === 'gps' && gpsAddress && (
        <div style={{
          padding: '20px',
          borderRadius: '16px',
          border: '1.5px solid #e0e7ff',
          backgroundColor: '#f8fafc',
          marginBottom: '24px',
          fontFamily: "'Inter', -apple-system, sans-serif"
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '14px' }}>
            🛰️ Auto-Detected Address Components
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px 16px', fontSize: '13px', lineHeight: 1.5 }}>
            {gpsAddress.address.houseNumber && (
              <>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>House / Flat No:</span>
                <span style={{ color: '#1f2937', fontWeight: 500 }}>{gpsAddress.address.houseNumber}</span>
              </>
            )}

            {gpsAddress.address.building && (
              <>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>Building / Apt:</span>
                <span style={{ color: '#1f2937', fontWeight: 500 }}>{gpsAddress.address.building}</span>
              </>
            )}

            {gpsAddress.address.street && (
              <>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>Street / Road:</span>
                <span style={{ color: '#1f2937', fontWeight: 500 }}>{gpsAddress.address.street}</span>
              </>
            )}

            <span style={{ color: '#6b7280', fontWeight: 600 }}>Pincode:</span>
            <span style={{ color: '#1f2937', fontWeight: 500 }}>{gpsAddress.address.pincode}</span>

            <span style={{ color: '#6b7280', fontWeight: 600 }}>Area / Village:</span>
            <span style={{ color: '#1f2937', fontWeight: 500 }}>{gpsAddress.address.area}</span>

            <span style={{ color: '#6b7280', fontWeight: 600 }}>District:</span>
            <span style={{ color: '#1f2937', fontWeight: 500 }}>{gpsAddress.address.city}</span>

            <span style={{ color: '#6b7280', fontWeight: 600 }}>State:</span>
            <span style={{ color: '#1f2937', fontWeight: 500 }}>{gpsAddress.address.state}</span>

            <span style={{ color: '#6b7280', fontWeight: 600 }}>Country:</span>
            <span style={{ color: '#1f2937', fontWeight: 500 }}>{gpsAddress.address.country}</span>
          </div>
        </div>
      )}

      {/* ── USER FRIENDLY WARNING IF GPS MISSED DISTRICT OR PINCODE ── */}
      {showDetectedWarning && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          backgroundColor: '#fffbeb',
          border: '1.5px solid #fef3c7',
          color: '#b45309',
          fontSize: '13px',
          fontWeight: 500,
          marginBottom: '20px',
          lineHeight: 1.4
        }}>
          ⚠️ District or PIN code could not be determined from the GPS location. Please verify or enter it manually.
        </div>
      )}

      {/* ── AWAY MODE: ADDRESS SELECTION FIELDS ── */}
      {mode === 'away' && (
        <div style={{ marginBottom: '24px' }}>
        {/* Country */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Country</label>
          <input
            type="text"
            value="India 🇮🇳"
            disabled
            style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#f3f4f6' }}
          />
        </div>

        {/* Pincode */}
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <label style={labelStyle}>
            Pincode * {loadingPincode && <span style={{ color: '#6366f1', fontSize: '11px', textTransform: 'none' }}>(Fetching details...)</span>}
          </label>
          <input
            type="text"
            placeholder="Enter 6-digit PIN code"
            value={watchedPincode || ''}
            {...register('pincode', {
              required: mode === 'away' ? 'Pincode is required' : false,
              onChange: handlePincodeChange
            })}
            maxLength={6}
            style={inputStyle}
            autoComplete="off"
          />
          {pincodeError && <p style={errorStyle}>{pincodeError}</p>}
          {errors.pincode && <p style={errorStyle}>{errors.pincode.message}</p>}
        </div>

        {/* State Selection Dropdown */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>State *</label>
          {loadingDataset ? (
            <select disabled style={{ ...selectStyle, opacity: 0.7 }}>
              <option>Loading States...</option>
            </select>
          ) : (
            <select
              value={watchedState || ''}
              {...register('state', {
                required: mode === 'away' ? 'State is required' : false,
                onChange: handleStateChange
              })}
              style={selectStyle}
            >
              <option value="">Select State</option>
              {stateNames.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          )}
          {errors.state && <p style={errorStyle}>{errors.state.message}</p>}
        </div>

        {/* District Selection Dropdown */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>District *</label>
          {!watchedState ? (
            <select disabled style={{ ...selectStyle, opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#f3f4f6' }}>
              <option value="">Please select a state first</option>
            </select>
          ) : (
            <select
              value={watchedCity || ''}
              {...register('city', {
                required: mode === 'away' ? 'District is required' : false
              })}
              style={selectStyle}
            >
              <option value="">Select District</option>
              {districtList.sort().map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          )}
          {errors.city && <p style={errorStyle}>{errors.city.message}</p>}
        </div>

        {/* Post Office / Area/Locality Dropdown if multiple post offices, else input text */}
        {postOffices.length > 1 ? (
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Post Office / Locality *</label>
            <select
              value={watch('area') || ''}
              {...register('area', {
                required: mode === 'away' ? 'Post Office / Locality is required' : false
              })}
              style={selectStyle}
            >
              <option value="">Select Post Office</option>
              {postOffices.map((po) => (
                <option key={po} value={po}>
                  {po}
                </option>
              ))}
            </select>
            {errors.area && <p style={errorStyle}>{errors.area.message}</p>}
          </div>
        ) : (
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Area / Locality / Village *</label>
            <input
              type="text"
              placeholder="Enter Area / Locality / Village"
              {...register('area', {
                required: mode === 'away' ? 'Area / Locality / Village is required' : false
              })}
              style={inputStyle}
              autoComplete="off"
            />
            {errors.area && <p style={errorStyle}>{errors.area.message}</p>}
          </div>
        )}

        {/* Street Name & House Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Street Name / Road *</label>
            <input
              type="text"
              placeholder="Street name"
              {...register('street', { required: mode === 'away' ? 'Street name / Road is required' : false })}
              style={inputStyle}
            />
            {errors.street && <p style={errorStyle}>{errors.street.message}</p>}
          </div>
          <div>
            <label style={labelStyle}>House / Flat No.</label>
            <input
              type="text"
              placeholder="House number"
              {...register('houseNumber')}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Landmark */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Landmark (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Near Apollo Hospital"
            {...register('landmark')}
            style={inputStyle}
          />
        </div>
      </div>
      )}

      {/* ── BOTH MODES: CONTACT & TYPE DETAILS ── */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '20px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
          Contact Info & Type
        </h3>

        {/* Full Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Full Name *</label>
          <input
            type="text"
            placeholder="Recipient's Name"
            {...register('fullName', { required: 'Full name is required' })}
            style={inputStyle}
          />
          {errors.fullName && <p style={errorStyle}>{errors.fullName.message}</p>}
        </div>

        {/* Mobile Numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Mobile Number *</label>
            <input
              type="tel"
              placeholder="Mobile number"
              {...register('mobile', { required: 'Mobile number is required' })}
              style={inputStyle}
            />
            {errors.mobile && <p style={errorStyle}>{errors.mobile.message}</p>}
          </div>
          <div>
            <label style={labelStyle}>Alt Mobile (Optional)</label>
            <input
              type="tel"
              placeholder="Alt mobile"
              {...register('alternateMobile')}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Address Type Toggle */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Address Type</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setValue('addressType', 'home')}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: '12px',
                border: watchedAddressType === 'home' ? '1.5px solid #6366f1' : '1.5px solid #e5e7eb',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: watchedAddressType === 'home' ? 'rgba(99, 102, 241, 0.06)' : '#ffffff',
                color: watchedAddressType === 'home' ? '#6366f1' : '#4b5563',
                boxShadow: watchedAddressType === 'home' ? '0 2px 6px rgba(99, 102, 241, 0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🏠 Home
            </button>
            <button
              type="button"
              onClick={() => setValue('addressType', 'work')}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: '12px',
                border: watchedAddressType === 'work' ? '1.5px solid #6366f1' : '1.5px solid #e5e7eb',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: watchedAddressType === 'work' ? 'rgba(99, 102, 241, 0.06)' : '#ffffff',
                color: watchedAddressType === 'work' ? '#6366f1' : '#4b5563',
                boxShadow: watchedAddressType === 'work' ? '0 2px 6px rgba(99, 102, 241, 0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              💼 Work
            </button>
          </div>
        </div>

        {/* Set as Default Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <input
            type="checkbox"
            id="isDefault"
            {...register('isDefault')}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="isDefault" style={{ fontSize: '13px', color: '#374151', fontWeight: 500, cursor: 'pointer' }}>
            Make default delivery address
          </label>
        </div>

        {/* Actions Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={cancelButtonStyle}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={saveButtonStyle}
          >
            {isSubmitting ? 'Saving Address...' : 'Save & Confirm'}
          </button>
        </div>
      </div>
    </form>
  );
};

// ── SHARED STYLES ──
const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#6b7280',
  marginBottom: '6px',
  display: 'block'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  fontSize: '14px',
  border: '1.5px solid #e5e7eb',
  borderRadius: '12px',
  backgroundColor: '#f9fafb',
  color: '#111827',
  outline: 'none',
  transition: 'all 0.2s'
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 16px center',
  backgroundSize: '16px'
};

const saveButtonStyle: React.CSSProperties = {
  flex: 2,
  backgroundColor: '#6366f1',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '12px',
  fontWeight: 700,
  fontSize: '14px',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

const cancelButtonStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: 'transparent',
  color: '#6b7280',
  padding: '14px',
  borderRadius: '12px',
  fontWeight: 600,
  fontSize: '14px',
  border: '1.5px solid #e5e7eb',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

const errorStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#ef4444',
  marginTop: '4px',
  margin: '4px 0 0 0',
  fontWeight: 500
};

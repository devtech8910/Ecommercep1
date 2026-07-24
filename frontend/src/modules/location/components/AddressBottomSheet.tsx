import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAddresses } from '../hooks/useAddresses';
import { useGeolocation } from '../hooks/useGeolocation';
import { useReverseGeocode } from '../hooks/useReverseGeocode';
import { AddressForm } from './AddressForm';
import { AddressCard } from './AddressCard';
import type { Address, AddressFormData, Coordinates } from '../types/location.types';

const matchDistrictNames = (postOfficeDistrict: string, targetDistrict: string): boolean => {
  const poD = postOfficeDistrict.toLowerCase();
  const tgt = targetDistrict.toLowerCase();
  
  if (poD.includes(tgt) || tgt.includes(poD)) return true;
  
  // Andhra Pradesh new-to-old district mappings for postal databases
  const apMapping: Record<string, string[]> = {
    'ntr': ['krishna', 'vijayawada'],
    'krishna': ['ntr'],
    'anakapalli': ['visakhapatnam', 'vizag'],
    'visakhapatnam': ['anakapalli'],
    'kakinada': ['east godavari'],
    'konaseema': ['east godavari'],
    'east godavari': ['kakinada', 'konaseema'],
    'eluru': ['west godavari'],
    'west godavari': ['eluru'],
    'bapatla': ['guntur', 'prakasam'],
    'palnadu': ['guntur'],
    'guntur': ['bapatla', 'palnadu'],
    'nandyal': ['kurnool'],
    'kurnool': ['nandyal'],
    'sri sathya sai': ['anantapur'],
    'anantapur': ['sri sathya sai'],
    'tirupati': ['chittoor', 'nellore'],
    'chittoor': ['tirupati'],
    'annamayya': ['cuddapah', 'kadapa', 'chittoor'],
    'cuddapah': ['annamayya', 'kadapa'],
    'kadapa': ['annamayya', 'cuddapah'],
    'parvathipuram manyam': ['vizianagaram', 'srikakulam'],
    'vizianagaram': ['parvathipuram manyam'],
    'alluri sitharama raju': ['visakhapatnam', 'east godavari', 'vizianagaram']
  };

  if (apMapping[tgt]) {
    return apMapping[tgt].some(mapped => poD.includes(mapped));
  }
  
  return false;
};

const fetchPincodeFallback = async (searchTerm: string, targetState: string, targetDistrict: string): Promise<{ pincode: string; name: string } | null> => {
  if (!searchTerm || !searchTerm.trim()) return null;
  try {
    const response = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(searchTerm.trim())}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data[0] && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice)) {
      const list = data[0].PostOffice;
      
      // 1. Filter by State
      const stateMatches = list.filter((po: any) => po.State.toLowerCase() === targetState.toLowerCase());
      if (stateMatches.length === 0) return null;
      
      // 2. Try to match District / Division using new-to-old district mappings
      const districtMatches = stateMatches.filter((po: any) => {
        return matchDistrictNames(po.District, targetDistrict) || matchDistrictNames(po.Division, targetDistrict);
      });
      
      const candidates = districtMatches.length > 0 ? districtMatches : stateMatches;
      const postOfficeResult = candidates[0];

      // Add console logging for debugging (Requirement 11)
      console.log("Nearest post office response:", postOfficeResult);

      if (postOfficeResult) {
        return {
          pincode: postOfficeResult.Pincode,
          name: postOfficeResult.Name
        };
      }
    }
  } catch (err) {
    console.warn('Postoffice pincode fallback lookup failed:', err);
  }
  return null;
};

interface AddressBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelected?: (address: Address) => void;
}

type SheetView = 'list' | 'choose-method' | 'gps-loading' | 'gps-form' | 'away-form';

export const AddressBottomSheet: React.FC<AddressBottomSheetProps> = ({
  isOpen,
  onClose,
  onAddressSelected
}) => {
  const [view, setView] = useState<SheetView>('list');
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  // GPS resolved details
  const [gpsCoords, setGpsCoords] = useState<Coordinates | null>(null);
  const [gpsAddress, setGpsAddress] = useState<{
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
  } | null>(null);
  
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const {
    addresses,
    loading: listLoading,
    loadAddresses,
    saveAddress,
    editAddress,
    removeAddress,
    makeDefault
  } = useAddresses();

  const {
    status: geoStatus,
    error: geoError,
    coords: geoCoords,
    requestLocation
  } = useGeolocation();

  const { performReverseGeocode } = useReverseGeocode();

  // Reset states when opening the modal
  useEffect(() => {
    if (isOpen) {
      loadAddresses();
      setView('list');
      setEditingAddress(null);
      setGpsCoords(null);
      setGpsAddress(null);
      setErrorToast(null);
    }
  }, [isOpen, loadAddresses]);

  // Handle GPS coordinate callback
  useEffect(() => {
    if (geoStatus === 'loading') {
      setView('gps-loading');
      setErrorToast(null);
    } else if (geoStatus === 'success' && geoCoords) {
      const lat = geoCoords.latitude;
      const lon = geoCoords.longitude;

      // 8. Add console logging for debugging only in GPS mode
      console.log("GPS lat:", lat);
      console.log("GPS lon:", lon);

      setGpsCoords({ lat, lng: lon });

      // 2. Call the OpenStreetMap Nominatim reverse geocoding API proxied through our backend
      fetch(`http://localhost:5000/location/nominatim-reverse?lat=${lat}&lon=${lon}`)
        .then((res) => {
          if (!res.ok) throw new Error('Nominatim reverse geocode request failed');
          return res.json();
        })
        .then(async (data) => {
          // 8. Add console logging for debugging only in GPS mode
          console.log("Reverse geocode response:", data);

          if (data && data.address) {
            const addr = data.address || {};
            
            // Sync map coordinates to the resolved location returned by Nominatim (Mylavaram coordinates on out-of-bounds fallback)
            const resolvedLat = parseFloat(data.lat) || lat;
            const resolvedLon = parseFloat(data.lon) || lon;
            setGpsCoords({ lat: resolvedLat, lng: resolvedLon });

            // 3. Map State, District, PIN code, Area/Locality, and Street
            const state = addr.state || '';
            // Prefer district level keys first (state_district, district, administrative_area_level_2) before county (subdistrict/mandal)
            const district = addr.state_district || addr.district || addr.administrative_area_level_2 || addr.county || '';
            const pincode = addr.postcode || addr.postal_code || '';
            const area = addr.suburb || addr.village || addr.city || addr.town || addr.hamlet || '';
            const street = addr.road || addr.street || addr.neighbourhood || '';

            // Check if District or Pincode is missing (no placeholders saved)
            const isDistrictMissing = !district.trim() || district.toLowerCase() === 'n/a';
            let isPincodeMissing = !pincode.trim() || pincode === '000000' || pincode.toLowerCase() === 'n/a';
            let finalPincode = isPincodeMissing ? '' : pincode;
            let resolvedArea = area;

            // Fallback PIN code resolution using India Post Office search API (Req 4)
            if (isPincodeMissing && state) {
              const searchTerms = [addr.county, addr.village, addr.city, addr.town].filter(Boolean);
              for (const term of searchTerms) {
                const fallbackResult = await fetchPincodeFallback(term, state, district || 'NTR');
                if (fallbackResult) {
                  console.log(`📍 PIN code automatically resolved via post office search API for "${term}":`, fallbackResult.pincode);
                  finalPincode = fallbackResult.pincode;
                  resolvedArea = fallbackResult.name || area;
                  isPincodeMissing = false;
                  break;
                }
              }
            }

            const resolvedAddress = {
              houseNumber: addr.house_number || '',
              building: addr.building || addr.apartment || '',
              street: street,
              area: resolvedArea,
              city: isDistrictMissing ? '' : district,
              state: state,
              pincode: finalPincode,
              country: addr.country || 'India'
            };

            setGpsAddress({
              formattedAddress: data.display_name || '',
              address: resolvedAddress
            });

            if (isDistrictMissing || isPincodeMissing) {
              setErrorToast('⚠️ District or PIN code could not be determined from the GPS location. Please verify or enter it manually.');
              setEditingAddress({
                id: '',
                fullName: '',
                mobile: '',
                alternateMobile: '',
                houseNumber: resolvedAddress.houseNumber,
                building: resolvedAddress.building,
                street: resolvedAddress.street,
                area: resolvedAddress.area,
                city: resolvedAddress.city,
                state: resolvedAddress.state,
                pincode: resolvedAddress.pincode,
                latitude: lat,
                longitude: lon,
                addressType: 'home',
                isDefault: false
              } as any);
              setView('away-form');
            } else {
              setView('gps-form');
            }
          } else {
            setErrorToast('Unable to geocode your GPS coordinates. Falling back to manual entry.');
            setView('away-form');
          }
        })
        .catch((err) => {
          console.error(err);
          setErrorToast('Network error resolving address components. Falling back to manual entry.');
          setView('away-form');
        });
    } else if (geoStatus === 'denied' || geoStatus === 'error') {
      setErrorToast(geoError || 'Location access denied or timed out.');
      setView('away-form');
    }
  }, [geoStatus, geoCoords, geoError, performReverseGeocode]);



  const handleFormSubmit = async (data: AddressFormData) => {
    try {
      let saved: Address;
      if (editingAddress) {
        saved = await editAddress(editingAddress.id, data);
      } else {
        saved = await saveAddress(data);
      }
      
      if (onAddressSelected) {
        onAddressSelected(saved);
      }
      onClose();
    } catch (err) {
      console.error('Failed to submit address details:', err);
      setErrorToast('Could not save your address. Please try again.');
    }
  };

  const handleEditInit = (address: Address) => {
    setEditingAddress(address);
    setView('away-form');
  };

  const handleSelectAddress = (address: Address) => {
    if (onAddressSelected) {
      onAddressSelected(address);
    }
    onClose();
  };

  if (!isOpen) return null;

  // Custom animation styles appended to document
  const cssAnimations = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return createPortal(
    <>
      <style>{cssAnimations}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.25s ease-out'
        }}
      />

      {/* Bottom Sheet Modal Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          backgroundColor: '#ffffff',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.08)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          color: '#1e293b'
        }}
      >
        {/* Top Drag Handle Indicator */}
        <div style={{ width: '40px', height: '4px', backgroundColor: '#d1d5db', borderRadius: '2px', margin: '12px auto 0' }} />

        {/* Sticky Modal Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: '#ffffff',
            padding: '16px 24px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'between'
          }}
        >
          <div style={{ flex: 1 }}>
            {view !== 'list' && (
              <button
                onClick={() => {
                  if (view === 'choose-method') {
                    setView('list');
                  } else if (view === 'gps-form' || view === 'away-form') {
                    if (editingAddress) {
                      setView('list');
                      setEditingAddress(null);
                    } else {
                      setView('choose-method');
                    }
                  }
                }}
                style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: 'transparent',
                  padding: 0,
                  marginBottom: '4px',
                  display: 'block'
                }}
              >
                ← Back
              </button>
            )}
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
              {view === 'list' && addresses.length > 0
                ? 'Select Delivery Address'
                : view === 'choose-method'
                ? 'Add Delivery Location'
                : view === 'gps-loading'
                ? 'Finding Location...'
                : editingAddress
                ? 'Edit Delivery Address'
                : 'Add Delivery Address'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#f3f4f6',
              border: 'none',
              fontSize: '18px',
              lineHeight: '32px',
              fontWeight: 500,
              cursor: 'pointer',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Main Content Box */}
        <div style={{ padding: '24px' }}>
          {errorToast && (
            <div style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #fca5a5', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>
              ⚠️ {errorToast}
            </div>
          )}

          {/* ── VIEW: LIST SAVED ADDRESSES ── */}
          {view === 'list' && addresses.length > 0 && !listLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Add New Button */}
              <button
                onClick={() => setView('choose-method')}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1.5px dashed #6366f1',
                  backgroundColor: 'rgba(99, 102, 241, 0.03)',
                  color: '#6366f1',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.03)')}
              >
                ➕ Add New Location
              </button>

              {/* Saved List Grid */}
              <div>
                <h3 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', margin: '0 0 12px 0' }}>
                  Saved Locations
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '12px'
                  }}
                >
                  {addresses.map((item) => (
                    <AddressCard
                      key={item.id}
                      address={item}
                      onSelect={handleSelectAddress}
                      onEdit={handleEditInit}
                      onDelete={removeAddress}
                      onMakeDefault={makeDefault}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── VIEW: TWO-BUTTON SELECTION (OR LIST EMPTY FALLBACK) ── */}
          {((view === 'list' && addresses.length === 0 && !listLoading) || view === 'choose-method') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0', textAlign: 'center', fontWeight: 500 }}>
                Please set your delivery address to proceed with order:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {/* GPS Autodetect Button */}
                <button
                  onClick={() => requestLocation()}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1.5px solid #c7d2fe',
                    backgroundColor: 'rgba(99, 102, 241, 0.02)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    width: '100%',
                    transition: 'border-color 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#c7d2fe')}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    📍
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1f2937' }}>
                      Use Current Location
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>
                      Autodetect current location details via GPS coordinates
                    </p>
                  </div>
                </button>

                {/* Away Manual Entry Button */}
                <button
                  onClick={() => setView('away-form')}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1.5px solid #e5e7eb',
                    backgroundColor: '#ffffff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    width: '100%',
                    transition: 'border-color 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#9ca3af')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    🏠
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1f2937' }}>
                      Away from Delivery Location
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>
                      Type manual address hierarchy using state/city filters
                    </p>
                  </div>
                </button>
              </div>

              {addresses.length > 0 && (
                <button
                  onClick={() => setView('list')}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px solid #e5e7eb',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  Back to Saved List
                </button>
              )}
            </div>
          )}

          {/* ── VIEW: GPS LOADING SPINNER ── */}
          {view === 'gps-loading' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  border: '3.5px solid #f3f4f6',
                  borderTopColor: '#6366f1',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
                Detecting location coords and fetching address details...
              </p>
            </div>
          )}

          {/* ── VIEW: GPS ADDRESS FORM ── */}
          {view === 'gps-form' && (
            <AddressForm
              mode="gps"
              gpsCoords={gpsCoords}
              gpsAddress={gpsAddress}
              onSubmit={handleFormSubmit}
              onCancel={() => setView('choose-method')}
            />
          )}

          {/* ── VIEW: AWAY ADDRESS FORM ── */}
          {view === 'away-form' && (
            <AddressForm
              mode="away"
              initialData={editingAddress ? {
                fullName: editingAddress.fullName,
                mobile: editingAddress.mobile,
                alternateMobile: editingAddress.alternateMobile,
                houseNumber: editingAddress.houseNumber,
                building: editingAddress.building || '',
                street: editingAddress.street,
                area: editingAddress.area,
                landmark: editingAddress.landmark || '',
                city: editingAddress.city,
                state: editingAddress.state,
                country: editingAddress.country,
                pincode: editingAddress.pincode,
                latitude: editingAddress.latitude,
                longitude: editingAddress.longitude,
                addressType: editingAddress.addressType,
                isDefault: editingAddress.isDefault
              } : undefined}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                if (editingAddress) {
                  setView('list');
                  setEditingAddress(null);
                } else {
                  setView('choose-method');
                }
              }}
            />
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

import { useState, useCallback } from 'react';
import type { GPSLocation } from '../types/location.types';

export type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error' | 'denied';

export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<GPSLocation | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      // Fallback to IP Geolocation immediately if browser doesn't support geolocation
      setStatus('loading');
      fetchIPFallback(
        () => setStatus('error'),
        (msg) => setError(msg)
      );
      return;
    }

    setStatus('loading');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setStatus('success');
      },
      (geoError) => {
        console.warn('Browser geolocation failed. Trying IP-based location fallback...', geoError.message);
        
        // Fallback to IP-based Geolocation if browser permission denied, timed out, or unavailable
        fetchIPFallback(
          () => {
            if (geoError.code === geoError.PERMISSION_DENIED) {
              setStatus('denied');
              setError('Location permission denied. Please enter address manually.');
            } else {
              setStatus('error');
              setError(geoError.message || 'Unable to retrieve location coordinates.');
            }
          },
          (msg) => setError(msg)
        );
      },
      {
        enableHighAccuracy: false, // Disables active hardware GPS query on desktops for instant return
        timeout: 8000,             // 8 seconds timeout
        maximumAge: 300000         // 5 minutes cache
      }
    );
  }, []);

  const fetchIPFallback = (onFailure: () => void, onErrorMsg: (msg: string) => void) => {
    fetch('https://ipapi.co/json/')
      .then((res) => {
        if (!res.ok) throw new Error('IP Geolocation API failed');
        return res.json();
      })
      .then((ipData) => {
        if (ipData && ipData.latitude && ipData.longitude) {
          console.log('📍 Location detected successfully via IP fallback:', ipData);
          setCoords({
            latitude: ipData.latitude,
            longitude: ipData.longitude,
            accuracy: 15000 // Approximate
          });
          setStatus('success');
        } else {
          throw new Error('Invalid coordinates returned from IP Geolocation.');
        }
      })
      .catch((err) => {
        console.error('IP Geolocation fallback failed:', err);
        onFailure();
        onErrorMsg('Unable to retrieve location. Please type manually.');
      });
  };

  return {
    status,
    error,
    coords,
    requestLocation
  };
}

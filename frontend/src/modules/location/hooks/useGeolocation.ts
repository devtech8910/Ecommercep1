import { useState, useCallback } from 'react';
import type { GPSLocation } from '../types/location.types';

export type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error' | 'denied';

export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<GPSLocation | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Geolocation is not supported by your browser.');
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
        // If high accuracy times out, try low accuracy fallback (which works instantly on desktops)
        if (geoError.code === geoError.TIMEOUT) {
          console.warn('High accuracy timed out, retrying with low accuracy...');
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setCoords({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy
              });
              setStatus('success');
            },
            (err) => {
              console.warn('Fallback low accuracy geolocation failed:', err);
              if (err.code === err.PERMISSION_DENIED) {
                setStatus('denied');
                setError('Location permission denied. Please enter address manually.');
              } else {
                setStatus('error');
                setError(err.message || 'Unable to retrieve location coordinates.');
              }
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 60000
            }
          );
        } else if (geoError.code === geoError.PERMISSION_DENIED) {
          setStatus('denied');
          setError('Location permission denied. Please enter address manually.');
        } else {
          setStatus('error');
          setError(geoError.message || 'Unable to retrieve location coordinates.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }, []);

  return {
    status,
    error,
    coords,
    requestLocation
  };
}

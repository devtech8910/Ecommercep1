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

    const optionsHigh = {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0
    };

    const optionsLow = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 0
    };

    const tryLowAccuracy = () => {
      console.log('Retrying browser geolocation with enableHighAccuracy: false (Wi-Fi/Cellular positioning)...');
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
          console.warn('Low accuracy geolocation failed. Falling back to IP-based geolocator...', geoError.message);
          fetchIPFallback(
            () => {
              setStatus('error');
              setError(geoError.message || 'Unable to retrieve location coordinates.');
            },
            (msg) => setError(msg)
          );
        },
        optionsLow
      );
    };

    let watchId: number | null = null;
    let fallbackTimeout = setTimeout(() => {
      // If we don't get high-accuracy coords within 5 seconds, clear watch and try low accuracy
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      tryLowAccuracy();
    }, 5000);

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const acc = position.coords.accuracy;
        console.log(`GPS refinement update: Lat: ${position.coords.latitude}, Lon: ${position.coords.longitude}, Accuracy: ${acc} meters`);
        
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: acc
        });
        setStatus('success');

        // Stop watching as soon as we acquire a high-precision fix (under 100m accuracy)
        if (acc < 100 && watchId !== null) {
          clearTimeout(fallbackTimeout);
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
      },
      (geoError) => {
        clearTimeout(fallbackTimeout);
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
        if (geoError.code === geoError.PERMISSION_DENIED) {
          console.warn('Browser geolocation permission denied.');
          setStatus('denied');
          setError("Location access is blocked in your browser. Please click the lock/settings icon in your address bar (next to 'localhost:3000'), set Location to 'Allow', and refresh the page.");
          return;
        }
        tryLowAccuracy();
      },
      optionsHigh
    );
  }, []);

  const fetchIPFallback = (onFailure: () => void, onErrorMsg: (msg: string) => void) => {
    fetch(`https://ipapi.co/json/?cb=${Date.now()}`)
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

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Coordinates } from '../types/location.types';

// Fix missing Leaflet marker icon asset issue by using custom SVG URI
const customMarkerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg width="38" height="45" viewBox="0 0 38 45" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 0C8.5 0 0 8.5 0 19C0 32.3 19 45 19 45C19 45 38 32.3 38 19C38 8.5 29.5 0 19 0Z" fill="#6366f1"/>
      <circle cx="19" cy="19" r="8" fill="white"/>
      <circle cx="19" cy="19" r="4" fill="#6366f1"/>
    </svg>
  `),
  iconSize: [38, 45],
  iconAnchor: [19, 45],
  popupAnchor: [0, -40]
});

interface MapPickerProps {
  center: Coordinates;
  onLocationChange: (coords: Coordinates) => void;
  className?: string;
}

/**
 * ChangeMapView — Dynamically pans the Leaflet map when the center prop changes.
 * react-leaflet's MapContainer only reads `center` on first mount, so this
 * child component uses the `useMap()` hook to imperatively call setView().
 */
const ChangeMapView: React.FC<{ center: Coordinates }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center.lat, center.lng, map]);
  return null;
};

/**
 * MapEventsComponent handles clicks on the map to relocate the marker (Phase 7)
 */
const MapEventsComponent: React.FC<{ onMapClick: (coords: Coordinates) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
};

/**
 * MapPicker — Renders Leaflet OpenStreetMap container (Phase 7)
 * Height: 250px (Strictly enforced)
 */
export const MapPicker: React.FC<MapPickerProps> = ({
  center,
  onLocationChange,
  className = ''
}) => {
  const markerRef = useRef<L.Marker>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([center.lat, center.lng]);

  useEffect(() => {
    setMapCenter([center.lat, center.lng]);
  }, [center]);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          onLocationChange({ lat: latLng.lat, lng: latLng.lng });
        }
      },
    }),
    [onLocationChange]
  );

  return (
    <div className={`map-picker-wrapper ${className}`} style={{ position: 'relative' }}>
      <div style={{ height: '250px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
        <MapContainer
          center={mapCenter}
          zoom={16}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          />
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={[center.lat, center.lng]}
            icon={customMarkerIcon}
            ref={markerRef}
          />
          <MapEventsComponent onMapClick={onLocationChange} />
          {/* Dynamically pan map when center changes (fixes static map bug) */}
          <ChangeMapView center={center} />
        </MapContainer>
      </div>

      {/* Coordinate display overlay (Phase 7) */}
      <div className="absolute bottom-3 left-3 z-[1000] px-3 py-1.5 rounded-lg bg-white/90 border border-black/10 text-[10px] text-slate-700 font-mono backdrop-blur-sm">
        LAT: {center.lat.toFixed(6)} | LNG: {center.lng.toFixed(6)}
      </div>
    </div>
  );
};

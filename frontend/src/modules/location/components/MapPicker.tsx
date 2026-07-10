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
  height?: number;
  interactive?: boolean;
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
 * MapEventsComponent handles clicks on the map to relocate the marker
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
 * MapPicker — Renders Leaflet map with Google Maps tiles.
 * Supports configurable height and interactive mode.
 */
export const MapPicker: React.FC<MapPickerProps> = ({
  center,
  onLocationChange,
  height = 220,
  interactive = true,
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
    <div style={{ position: 'relative' }}>
      <div
        style={{
          height: `${height}px`,
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        <MapContainer
          center={mapCenter}
          zoom={16}
          scrollWheelZoom={interactive}
          dragging={interactive}
          doubleClickZoom={interactive}
          zoomControl={interactive}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          />
          <Marker
            draggable={interactive}
            eventHandlers={interactive ? eventHandlers : {}}
            position={[center.lat, center.lng]}
            icon={customMarkerIcon}
            ref={markerRef}
          />
          {interactive && <MapEventsComponent onMapClick={onLocationChange} />}
          {/* Dynamically pan map when center changes (fixes static map bug) */}
          <ChangeMapView center={center} />
        </MapContainer>
      </div>

      {/* Coordinate display overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          zIndex: 1000,
          padding: '4px 12px',
          borderRadius: '8px',
          backgroundColor: 'rgba(255,255,255,0.9)',
          border: '1px solid rgba(0,0,0,0.1)',
          fontSize: '10px',
          color: '#334155',
          fontFamily: 'monospace',
          backdropFilter: 'blur(4px)',
        }}
      >
        LAT: {center.lat.toFixed(6)} | LNG: {center.lng.toFixed(6)}
      </div>
    </div>
  );
};

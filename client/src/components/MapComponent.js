import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Fix for Leaflet marker icons not loading in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapComponent({ userLocations, heatmapData, onMapClick }) {
  const mapRef = useRef();

  // Constants from simulation.js
  const DEFAULT_CENTER = [76.262928, 11.038216]; // [lon, lat] as per your convention
  const DEFAULT_ZOOM = 16.8;

  // Add heatmap layer when heatmapData changes
  useEffect(() => {
    if (mapRef.current && heatmapData && heatmapData.length > 0) {
      // Parse MongoDB prediction data
      const heatPoints = heatmapData.map(point => {
        const lat = parseFloat(point.lat?.$numberDouble || point.lat);
        const lon = parseFloat(point.lon?.$numberDouble || point.lon);
        const prediction = parseInt(point.prediction?.$numberInt || point.prediction, 10);
        // prediction is either 0 or 1: 0 = safe (low intensity), 1 = not safe (high intensity)
        return [lat, lon, prediction === 1 ? 0.8 : 0.2];
      }).filter(point => !isNaN(point[0]) && !isNaN(point[1]));

      const heatLayer = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.2: 'green',  // Low intensity (safe, prediction = 0)
          0.5: 'yellow', // Mid-range (not used here, but included for gradient smoothness)
          0.8: 'red',    // High intensity (not safe, prediction = 1)
        },
      }).addTo(mapRef.current);

      return () => {
        if (mapRef.current) {
          mapRef.current.removeLayer(heatLayer);
        }
      };
    }
  }, [heatmapData]);

  // Handle map click events
  useEffect(() => {
    if (mapRef.current && onMapClick) {
      const handleClick = (e) => {
        const { lat, lng } = e.latlng;
        // Convert Leaflet's [lat, lng] to your [lon, lat] convention
        onMapClick({ lon: lng, lat: lat });
      };
      mapRef.current.on('click', handleClick);

      return () => {
        if (mapRef.current) {
          mapRef.current.off('click', handleClick);
        }
      };
    }
  }, [onMapClick]);

  return (
    <MapContainer
      center={[DEFAULT_CENTER[1], DEFAULT_CENTER[0]]} // Convert [lon, lat] to [lat, lon] for Leaflet
      zoom={DEFAULT_ZOOM}
      style={{ height: '500px', width: '100%' }}
      whenCreated={map => (mapRef.current = map)}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {userLocations && userLocations.map(user => (
        user.lat && user.lon && (
          <Marker
            key={user.uid}
            position={[user.lat, user.lon]}
          >
            <Popup>
              User: {user.uid}
            </Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  );
}

export default MapComponent;
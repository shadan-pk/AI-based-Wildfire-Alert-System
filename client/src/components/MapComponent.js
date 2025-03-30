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

function MapComponent({ userLocations, heatmapData }) {
  const mapRef = useRef();

  // Add heatmap layer when heatmapData changes
  useEffect(() => {
    if (mapRef.current && heatmapData && heatmapData.length > 0) {
      // Create heatmap points: [lat, lon, intensity]
      const heatPoints = heatmapData.map(point => [
        point.lat,
        point.lon,
        point.prediction === 1 ? 0.8 : 0.2, // Higher intensity for "not safe" (1), lower for "safe" (0)
      ]);

      // Add heatmap layer to the map
      const heatLayer = L.heatLayer(heatPoints, {
        radius: 25,      // Size of heatmap spots
        blur: 15,        // Blur for smoother transitions
        maxZoom: 17,     // Max zoom level for heatmap visibility
        gradient: {      // Custom gradient: green (safe) to red (not safe)
          0.2: 'green',
          0.5: 'yellow',
          0.8: 'red',
        },
      }).addTo(mapRef.current);

      // Cleanup: Remove heatmap layer when component unmounts or data changes
      return () => {
        if (mapRef.current) {
          mapRef.current.removeLayer(heatLayer);
        }
      };
    }
  }, [heatmapData]);

  return (
    <MapContainer
      center={[11.0389, 76.2631]} // Default center (your region, adjust as needed)
      zoom={10}                   // Initial zoom level
      style={{ height: '500px', width: '100%' }} // Map dimensions
      whenCreated={map => (mapRef.current = map)} // Store map instance
    >
      {/* Base tile layer from OpenStreetMap */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* User location markers */}
      {userLocations && userLocations.map(user => (
        user.lat && user.lon && ( // Ensure lat/lon exist before rendering
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
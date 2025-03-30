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
  const DEFAULT_CENTER = [76.262928, 11.038216]; // [lon, lat]
  const DEFAULT_ZOOM = 16.8;

  useEffect(() => {
    console.log('MapComponent received userLocations:', userLocations);
    console.log('MapComponent received heatmapData:', heatmapData);
  }, [userLocations, heatmapData]);

  // Add heatmap layer when map is ready and heatmapData changes
  useEffect(() => {
    if (!mapRef.current) {
      console.log('Map not yet initialized, skipping heatmap generation');
      return;
    }
    if (!heatmapData || heatmapData.length === 0) {
      console.log('No heatmap data available');
      return;
    }

    console.log('Generating heatmap with data:', heatmapData);

  const heatPoints = heatmapData
    .map(point => {
      // Simpler parsing logic
      const lat = typeof point.lat === 'object' ? parseFloat(point.lat.$numberDouble) : parseFloat(point.lat);
      const lon = typeof point.lon === 'object' ? parseFloat(point.lon.$numberDouble) : parseFloat(point.lon);
      const prediction = typeof point.prediction === 'object' ? 
        parseInt(point.prediction.$numberInt) : parseInt(point.prediction);
      
      // Debug logging
      console.log(`Processing point: ${lat}, ${lon}, ${prediction}`);
      
      if (isNaN(lat) || isNaN(lon)) {
        console.warn('Invalid coordinates:', point);
        return null;
      }
      
      return [lat, lon, prediction === 1 ? 0.8 : 0.2];
    })
    .filter(Boolean); // Filter out null values

    if (heatPoints.length === 0) {
      console.warn('No valid heatmap points generated');
    } else {
      const heatLayer = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: { 0.2: 'green', 0.5: 'yellow', 0.8: 'red' },
      }).addTo(mapRef.current);
      console.log('Heatmap layer added with', heatPoints.length, 'points');

      return () => {
        if (mapRef.current) {
          mapRef.current.removeLayer(heatLayer);
          console.log('Heatmap layer removed');
        }
      };
    }
  }, [heatmapData]); // Depend on mapRef.current explicitly

  useEffect(() => {
    if (mapRef.current && onMapClick) {
      const handleClick = (e) => {
        const { lat, lng } = e.latlng;
        onMapClick({ lon: lng, lat: lat });
      };
      mapRef.current.on('click', handleClick);
      return () => mapRef.current.off('click', handleClick);
    }
  }, [onMapClick]);

  return (
      <MapContainer
        center={[DEFAULT_CENTER[1], DEFAULT_CENTER[0]]}
        zoom={DEFAULT_ZOOM}
        style={{ height: '500px', width: '100%' }}
        ref={mapRef}
      >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {userLocations && userLocations.map(user => (
        user.lat && user.lon && (
          <Marker key={user.uid} position={[user.lat, user.lon]}>
            <Popup>User: {user.uid}</Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  );
}

export default MapComponent;
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
  const DEFAULT_CENTER = [11.038216, 76.262928]; // [lat, lon] - correct order
  const DEFAULT_ZOOM = 13; // A more zoomed-out view to show more context

  useEffect(() => {
    console.log('MapComponent received userLocations:', userLocations);
    console.log('MapComponent received heatmapData:', heatmapData);
  }, [userLocations, heatmapData]);

  // Calculate intensity based on prediction and metadata
  const calculateIntensity = (prediction, metadata) => {
    // Base intensity from prediction
    const baseIntensity = prediction === 1 ? 0.8 : 0.2;
    
    // Factor in additional metadata if available
    let modifier = 1.0;
    
    if (metadata) {
      // Apply modifiers based on factors like:
      if (metadata.windSpeed) modifier *= (1 + (metadata.windSpeed / 100));
      if (metadata.temperature) modifier *= (1 + ((metadata.temperature - 25) / 50));
      if (metadata.humidity) modifier *= (1 - (metadata.humidity / 200));
    }
    
    return Math.min(1.0, baseIntensity * modifier);
  };

  // Add heatmap layer when map is ready and heatmapData changes
  useEffect(() => {
    if (!mapRef.current || !heatmapData || heatmapData.length === 0) {
      console.log('Map not initialized or no heatmap data available');
      return;
    }

    // Capture the current map reference
    const currentMap = mapRef.current;
    
    // Clear existing heatmap layers to prevent stacking
    currentMap.eachLayer(layer => {
      if (layer._heat) { // Check for heat property which exists on L.HeatLayer instances
        currentMap.removeLayer(layer);
        console.log('Removed existing heatmap layer');
      }
    });
    
    console.log('Generating heatmap with data:', heatmapData);
    
    const heatPoints = heatmapData.map(point => {
      const lat = parseFloat(point.lat?.$numberDouble || point.lat);
      const lon = parseFloat(point.lon?.$numberDouble || point.lon);
      const prediction = parseInt(point.prediction?.$numberInt || point.prediction, 10);
      
      // More realistic intensity scaling with slight randomization for natural look
      const intensity = calculateIntensity(prediction, point.metadata);
      const naturalizedIntensity = intensity * (0.9 + Math.random() * 0.2); // Add +/-10% variation
      
      const heatPoint = [lat, lon, naturalizedIntensity];
      return heatPoint;
    }).filter(point => !isNaN(point[0]) && !isNaN(point[1]));

    if (heatPoints.length === 0) {
      console.warn('No valid heatmap points generated');
    } else {
      console.log(`Adding heatmap with ${heatPoints.length} points`);
      
      const heatLayer = L.heatLayer(heatPoints, {
        radius: 25, 
        blur: 15,
        maxZoom: 17,
        minOpacity: 0.3,
        max: 1.0,
        gradient: {
          0.1: 'blue',
          0.3: 'lime',
          0.5: 'yellow',
          0.7: 'orange',
          0.9: 'red'
        }
      }).addTo(currentMap);
      
      console.log('Heatmap layer added with', heatPoints.length, 'points');

      return () => {
        if (currentMap) {
          currentMap.removeLayer(heatLayer);
          console.log('Heatmap layer removed in cleanup');
        }
      };
    }
  }, [heatmapData]);

  useEffect(() => {
    if (mapRef.current && onMapClick) {
      const handleClick = (e) => {
        const { lat, lng } = e.latlng;
        onMapClick({ lon: lng, lat: lat });
      };
      
      const currentMap = mapRef.current;
      currentMap.on('click', handleClick);
      
      return () => currentMap.off('click', handleClick);
    }
  }, [onMapClick]);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '700px', width: '100%' }}
      ref={mapRef}
      preferCanvas={true} // Use Canvas rendering for better performance with heatmaps
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Add satellite layer for more realism */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        opacity={0.3} // Blend with base map
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
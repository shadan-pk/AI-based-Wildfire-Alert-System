import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { doc, updateDoc, collection, setDoc } from 'firebase/firestore';
import { db } from '../FirebaseConfig';

// Fix for Leaflet marker icons not loading in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icons for safe and unsafe users
const safeIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const unsafeIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper component to manage map view and updates
function MapUpdater({ userLocations, heatmapData }) {
  const map = useMap();
  
  useEffect(() => {
    // If we have users, focus on them
    if (userLocations && userLocations.length > 0) {
      const bounds = L.latLngBounds(userLocations.map(user => [user.lat, user.lon]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    // If no users but we have heatmap data, focus on that
    else if (heatmapData && heatmapData.length > 0) {
      const validPoints = heatmapData.filter(point => {
        const lat = parseFloat(point.lat?.$numberDouble || point.lat);
        const lon = parseFloat(point.lon?.$numberDouble || point.lon);
        return !isNaN(lat) && !isNaN(lon);
      });
      
      if (validPoints.length > 0) {
        const heatBounds = L.latLngBounds(validPoints.map(point => {
          const lat = parseFloat(point.lat?.$numberDouble || point.lat);
          const lon = parseFloat(point.lon?.$numberDouble || point.lon);
          return [lat, lon];
        }));
        map.fitBounds(heatBounds, { padding: [50, 50] });
      }
    }
  }, [userLocations, heatmapData, map]);
  
  return null;
}

// Separate component for the heatmap layer
function HeatmapLayer({ map, heatmapData }) {
  useEffect(() => {
    if (!map || !heatmapData || heatmapData.length === 0) {
      return;
    }
    
    // Clear existing heatmap layers
    map.eachLayer(layer => {
      if (layer._heat) {
        map.removeLayer(layer);
      }
    });
    
    const heatPoints = heatmapData
      .map(point => {
        const lat = parseFloat(point.lat?.$numberDouble || point.lat);
        const lon = parseFloat(point.lon?.$numberDouble || point.lon);
        const prediction = parseInt(point.prediction?.$numberInt || point.prediction, 10);
        
        // More intense for predicted wildfire locations
        const intensity = prediction === 1 ? 0.8 : 0.2;
        
        return [lat, lon, intensity];
      })
      .filter(point => !isNaN(point[0]) && !isNaN(point[1]));

    if (heatPoints.length > 0) {
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
      }).addTo(map);
      
      return () => {
        if (map) {
          map.removeLayer(heatLayer);
        }
      };
    }
  }, [map, heatmapData]);
  
  return null;
}

function MapComponent({ userLocations, heatmapData }) {
  const mapRef = useRef();
  const DEFAULT_CENTER = [11.038216, 76.262928];
  const DEFAULT_ZOOM = 13;
  const [userSafetyStatus, setUserSafetyStatus] = useState({});
  const [mapInstance, setMapInstance] = useState(null);
  
  // Calculate user safety based on heatmap proximity
  useEffect(() => {
    if (!userLocations || !heatmapData || heatmapData.length === 0 || userLocations.length === 0) return;
    
    console.log('Calculating safety status for users');
    
    const safetyUpdates = {};
    const DANGER_THRESHOLD = 0.05; // Distance threshold in degrees (approx 5km)
    
    userLocations.forEach(user => {
      try {
        // Check if user is within danger zone of any heatmap point
        let minDistance = Number.MAX_VALUE;
        let inDanger = false;
        
        for (const point of heatmapData) {
          const lat = parseFloat(point.lat?.$numberDouble || point.lat);
          const lon = parseFloat(point.lon?.$numberDouble || point.lon);
          const prediction = parseInt(point.prediction?.$numberInt || point.prediction, 10);
          
          if (isNaN(lat) || isNaN(lon)) continue;
          
          // Only consider high-risk prediction points
          if (prediction === 1) {
            const distance = calculateDistance(user.lat, user.lon, lat, lon);
            minDistance = Math.min(minDistance, distance);
            
            if (distance < DANGER_THRESHOLD) {
              inDanger = true;
              break;
            }
          }
        }
        
        // Update safety status
        const isSafe = !inDanger;
        safetyUpdates[user.uid] = {
          safe: isSafe,
          minDistance
        };
        
        // Update in Firebase - using try/catch to handle permission errors
        if (user.email) {
          updateUserSafetyStatus(user.uid, user.email, isSafe)
            .catch(error => {
              console.error(`Firebase update error for ${user.email}:`, error.message);
            });
        }
      } catch (error) {
        console.error('Error processing user safety:', error);
      }
    });
    
    setUserSafetyStatus(safetyUpdates);
  }, [userLocations, heatmapData]);
  
  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d / 111; // Convert to approximate degrees
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };
  
  // Update safety status in Firebase with error handling
  const updateUserSafetyStatus = async (uid, email, isSafe) => {
    try {
      // Create the situation collection first to avoid permission errors
      const userDocRef = doc(collection(db, 'userLocation'), email);
      const situationCollRef = collection(userDocRef, 'situation');
      const safetyDocRef = doc(situationCollRef, 'SafeOrNot');
      
      // Update the safety status
      await setDoc(safetyDocRef, { safe: isSafe }, { merge: true });
      
      return true;
    } catch (error) {
      console.error(`Failed to update safety for ${email}:`, error);
      throw error; // Re-throw for higher-level handling
    }
  };

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '700px', width: '100%' }}
      whenCreated={mapInstance => {
        mapRef.current = mapInstance;
        setMapInstance(mapInstance);
      }}
      preferCanvas={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        opacity={0.3}
      />
      
      {/* Always render heatmap regardless of user presence */}
      {mapInstance && <HeatmapLayer map={mapInstance} heatmapData={heatmapData} />}
      
      {userLocations && userLocations.map(user => {
        const isSafe = userSafetyStatus[user.uid]?.safe;
        const safetyText = isSafe !== undefined ? (isSafe ? 'SAFE' : 'DANGER') : 'Unknown';
        const icon = isSafe !== undefined ? (isSafe ? safeIcon : unsafeIcon) : new L.Icon.Default();
        
        return (
          user.lat && user.lon && (
            <Marker 
              key={user.uid} 
              position={[user.lat, user.lon]}
              icon={icon}
            >
              <Popup>
                <div>
                  <strong>User:</strong> {user.email || user.uid}<br/>
                  <strong>Status:</strong> <span style={{color: isSafe ? 'green' : 'red'}}>{safetyText}</span><br/>
                  <strong>Location:</strong> {user.lat.toFixed(6)}, {user.lon.toFixed(6)}
                </div>
              </Popup>
            </Marker>
          )
        );
      })}
      
      <MapUpdater userLocations={userLocations} heatmapData={heatmapData} />
    </MapContainer>
  );
}

export default MapComponent;
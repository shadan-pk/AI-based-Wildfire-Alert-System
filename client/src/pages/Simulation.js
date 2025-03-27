import React, { useState, useRef } from 'react';
import Map from '../components/Map';
import SimulationForm from '../components/SimulationForm';

const Simulation = () => {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const mapRef = useRef(null);

  const DEFAULT_CENTER = [76.262928, 11.038216];
  const DEFAULT_ZOOM = 16.8;

  const handleMapClick = (lngLat) => {
    setSelectedPoint({ lat: lngLat.lat, lon: lngLat.lng });
  };

  const handleFormSubmit = () => {
    setSelectedPoint(null); // Reset after submission
  };

  const handleResetCenter = () => {
    // Check if mapRef and its resetView method exist
    if (mapRef.current && mapRef.current.resetView) {
      mapRef.current.resetView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerContainer}>
        <h1 style={styles.header}>Create Simulation Data</h1>
        <button 
          onClick={handleResetCenter} 
          style={styles.resetButton}
        >
          Reset to Center
        </button>
      </div>
      <Map 
        ref={mapRef}
        center={DEFAULT_CENTER} 
        zoom={DEFAULT_ZOOM} 
        onClick={handleMapClick} 
      />
      {selectedPoint && (
        <div style={styles.formContainer}>
          <h3 style={styles.subHeader}>
            Selected Location: ({selectedPoint.lat.toFixed(4)}, {selectedPoint.lon.toFixed(4)})
          </h3>
          <SimulationForm
            lat={selectedPoint.lat}
            lon={selectedPoint.lon}
            onSubmit={handleFormSubmit}
          />
        </div>
      )}
    </div>
  );
};
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
  },
  header: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
    textAlign: 'center',
  },
  formContainer: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  subHeader: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '15px',
  },
};

export default Simulation;
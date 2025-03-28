import React, { useState, useRef } from 'react';
import axios from 'axios';
import Map from '../components/Map';
import SimulationForm from '../components/SimulationForm';

const Simulation = () => {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [simulationList, setSimulationList] = useState([]);
  const mapRef = useRef(null);

  const DEFAULT_CENTER = [76.262928, 11.038216];
  const DEFAULT_ZOOM = 16.8;

  const handleMapClick = (lngLat) => {
    setSelectedPoint({ lat: lngLat.lat, lon: lngLat.lng });
  };

  const handleFormSubmit = (submittedData) => {
    setSimulationList((prevList) => [...prevList, submittedData]);
    setSelectedPoint(null);
  };

  const handleResetCenter = () => {
    if (mapRef.current && mapRef.current.resetView) {
      mapRef.current.resetView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/simulation/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'simulation_data.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSimulationList([]); // Clear frontend list after download
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download simulation data');
    }
  };

  const handleDelete = async (index) => {
    try {
      // Remove from frontend list
      const updatedList = simulationList.filter((_, i) => i !== index);
      setSimulationList(updatedList);

      // Sync with backend by overwriting simulationData
      await axios.post(`${process.env.REACT_APP_API_URL}/simulation/sync`, updatedList, {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete simulation data');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerContainer}>
        <h1 style={styles.header}>Create Simulation Data</h1>
      </div>
      <Map
        ref={mapRef}
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        onClick={handleMapClick}
      />
      <div style={styles.buttonContainer}>
      <button onClick={handleDownload} style={styles.downloadButton}>
          Download Simulation Data
        </button>
        <button onClick={handleResetCenter} style={styles.resetButton}>
          Reset to Center
        </button>
      </div>
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
      <div style={styles.listContainer}>
        <h3 style={styles.subHeader}>Submitted Simulation Data</h3>
        {simulationList.length === 0 ? (
          <p>No data submitted yet</p>
        ) : (
          <ul style={styles.list}>
            {simulationList.map((item, index) => (
              <li key={index} style={styles.listItem}>
                <div>
                  Lat: {item.lat.toFixed(4)}, Lon: {item.lon.toFixed(4)}, 
                  Data: {JSON.stringify(item.data, null, 2)}
                </div>
                <button
                  onClick={() => handleDelete(index)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
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
    fontSize: '44px',
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
  h3: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  subHeader: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginTop: '60px',
    color: '#555',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
  },
  downloadButton: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    marginLeft: '10px',
    marginRight: '10px',
  },
  resetButton: {
    backgroundColor: '#008CBA',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    // marginBottom: '10px',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'right',
    alignItems: 'center',
    marginBottom: '10px',
    marginTop: '10px',
  },
};

export default Simulation;
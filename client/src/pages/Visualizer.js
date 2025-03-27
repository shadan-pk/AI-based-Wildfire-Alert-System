import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Map from '../components/Map';

const Visualizer = () => {
  const [view, setView] = useState('temperature');
  const [heatmapData, setHeatmapData] = useState([]);
  const [userLocations, setUserLocations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (view === 'temperature') {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/simulation`);
          setHeatmapData(
            res.data.map((point) => ({
              lat: point.lat,
              lon: point.lon,
              weight: point.data.Temperature / 40,
            }))
          );
        } else if (view === 'prediction') {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/predictions`);
          setHeatmapData(
            res.data.map((point) => ({
              lat: point.lat,
              lon: point.lon,
              weight: point.prediction,
            }))
          );
        }
        const locRes = await axios.get(`${process.env.REACT_APP_API_URL}/user-locations`);
        setUserLocations(locRes.data);
      } catch (error) {
        console.error('Error fetching visualizer data:', error);
      }
    };
    fetchData();
  }, [view]);

  const handleUserClick = async (userId) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/user/${userId}`);
      setSelectedUser(res.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Heatmap Visualizer</h1>
      <div style={styles.controls}>
        <label style={styles.label}>Select View: </label>
        <select
          value={view}
          onChange={(e) => setView(e.target.value)}
          style={styles.select}
        >
          <option value="temperature">Temperature Heatmap</option>
          <option value="prediction">Prediction Heatmap</option>
        </select>
      </div>
      <Map
        center={[76.263, 11.039]}
        zoom={10}
        heatmapData={heatmapData}
        userLocations={userLocations}
        onUserClick={handleUserClick}
      />
      {selectedUser && (
        <div style={styles.userDetails}>
          <h2 style={styles.subHeader}>User Details</h2>
          <p style={styles.text}>Name: {selectedUser.name || 'N/A'}</p>
          <p style={styles.text}>Email: {selectedUser.email || 'N/A'}</p>
          <button
            onClick={() => setSelectedUser(null)}
            style={styles.button}
          >
            Close
          </button>
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
  controls: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
  },
  label: {
    fontSize: '16px',
    marginRight: '10px',
    color: '#555',
  },
  select: {
    padding: '8px 12px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  userDetails: {
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
    marginBottom: '10px',
  },
  text: {
    fontSize: '14px',
    color: '#666',
    margin: '5px 0',
  },
  button: {
    padding: '8px 16px',
    fontSize: '14px',
    color: '#fff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
  },
};

export default Visualizer;
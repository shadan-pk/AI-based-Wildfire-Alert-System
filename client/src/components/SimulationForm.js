import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/SimulationMap.css';

const SimulationFormModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [data, setData] = useState(initialData || {
    Temperature: 0,
    RH: 0,
    Ws: 0,
    Rain: 0,
    FFMC: 0,
    DMC: 0,
    DC: 0,
    ISI: 0,
    BUI: 0,
    FWI: 0,
  });

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: parseFloat(e.target.value) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(data);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <form onSubmit={handleSubmit}>
        {Object.keys(data).map((key) => (
          <div key={key}>
            <label>{key}: </label>
            <input
              type="number"
              name={key}
              value={data[key]}
              onChange={handleChange}
              step="0.1"
            />
          </div>
        ))}
        <button type="submit">Done</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
};

const SimulationForm = ({ lat: initialLat, lon: initialLon }) => {
  const [points, setPoints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({ lat: initialLat, lon: initialLon });

  // Update currentPosition when props change
  useEffect(() => {
    setCurrentPosition({ lat: initialLat, lon: initialLon });
  }, [initialLat, initialLon]);

  const handleAddData = () => {
    setShowForm(true);
  };

  const handleSaveData = async (data) => {
    try {
      const newPoint = { 
        lat: currentPosition.lat, 
        lon: currentPosition.lon, 
        data 
      };
      await axios.post(`${process.env.REACT_APP_API_URL}/simulation`, newPoint);
      setPoints([...points, newPoint]);
    } catch (error) {
      console.error('Error saving simulation data:', error);
    }
  };

  const handleDeletePoint = (index) => {
    setPoints(points.filter((_, i) => i !== index));
  };

  const handleDownloadJSON = () => {
    const jsonData = JSON.stringify(points, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'simulation_data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="simulation-container">
      <button className="add-data-btn" onClick={handleAddData}>Add Data</button>
      <button className="download-btn" onClick={handleDownloadJSON}>Download JSON</button>
      
      <SimulationFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSaveData}
      />

      <div className="points-list">
        <h3>Marked Points:</h3>
        {points.map((point, index) => (
          <div key={index} className="point-item">
            Point {index + 1}: Lat: {point.lat.toFixed(4)}, Lon: {point.lon.toFixed(4)}
            <button className="delete-btn" onClick={() => handleDeletePoint(index)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimulationForm;
import React, { useState } from 'react';
import axios from 'axios';

const SimulationForm = ({ lat, lon, onSubmit }) => {
  const [formData, setFormData] = useState({
    temperature_2m: '0',
    relative_humidity_2m: '0',
    wind_speed_10m: '0',
    precipitation: '0',
    FFMC: '0',
    DMC: '0',
    DC: '0',
    ISI: '0',
    BUI: '0',
    FWI: '0',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { lat, lon, data: { ...formData } }; // Combine lat, lon, and form data
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/simulation`, data);
      console.log('Server response:', response.data);
      onSubmit(data); // Pass the submitted data back to Simulation.js
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Failed to submit simulation data');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input type="number" name="temperature_2m" placeholder="Temperature (2m)" value={formData.temperature_2m} onChange={handleChange} style={styles.input} />
      <input type="number" name="relative_humidity_2m" placeholder="Relative Humidity (2m)" value={formData.relative_humidity_2m} onChange={handleChange} style={styles.input} />
      <input type="number" name="wind_speed_10m" placeholder="Wind Speed (10m)" value={formData.wind_speed_10m} onChange={handleChange} style={styles.input} />
      <input type="number" name="precipitation" placeholder="Precipitation" value={formData.precipitation} onChange={handleChange} style={styles.input} />
      <input type="number" name="FFMC" placeholder="FFMC" value={formData.FFMC} onChange={handleChange} style={styles.input} />
      <input type="number" name="DMC" placeholder="DMC" value={formData.DMC} onChange={handleChange} style={styles.input} />
      <input type="number" name="DC" placeholder="DC" value={formData.DMC} onChange={handleChange} style={styles.input} />
      <input type="number" name="ISI" placeholder="ISI" value={formData.ISI} onChange={handleChange} style={styles.input} />
      <input type="number" name="BUI" placeholder="BUI" value={formData.BUI} onChange={handleChange} style={styles.input} />
      <input type="number" name="FWI" placeholder="FWI" value={formData.FWI} onChange={handleChange} style={styles.input} />
      <button type="submit" style={styles.button}>Submit</button>
    </form>
  );
};

const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  input: { padding: '5px' },
  button: { padding: '5px 10px', cursor: 'pointer' },
};

export default SimulationForm;
import React, { useState } from 'react';
import axios from 'axios';

const SimulationForm = ({ lat, lon, onSubmit }) => {
  const [formData, setFormData] = useState({
    temperature_2m: '32',
    relative_humidity_2m: '28',
    wind_speed_10m: '0',
    precipitation: '11',
    FFMC: '101',
    DMC: '184',
    DC: '1000',
    ISI: '14',
    BUI: '168',
    FWI: '49',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    //convert formData values to numbers
    const numericData = {};
    for (const key in formData) {
      numericData[key] = parseFloat(formData[key]);
    }
    const data = { lat, lon, data:numericData }; // Combine lat, lon, and form data
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
    <div className="max-w-xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="temperature_2m" className="block text-sm font-medium text-gray-700 mb-1">
              Temperature (2m)
            </label>
            <input 
              id="temperature_2m"
              type="number" 
              name="temperature_2m" 
              placeholder="Enter temperature" 
              value={formData.temperature_2m} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="relative_humidity_2m" className="block text-sm font-medium text-gray-700 mb-1">
              Relative Humidity (2m)
            </label>
            <input 
              id="relative_humidity_2m"
              type="number" 
              name="relative_humidity_2m" 
              placeholder="Enter humidity" 
              value={formData.relative_humidity_2m} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="wind_speed_10m" className="block text-sm font-medium text-gray-700 mb-1">
              Wind Speed (10m)
            </label>
            <input 
              id="wind_speed_10m"
              type="number" 
              name="wind_speed_10m" 
              placeholder="Enter wind speed" 
              value={formData.wind_speed_10m} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="precipitation" className="block text-sm font-medium text-gray-700 mb-1">
              Precipitation
            </label>
            <input 
              id="precipitation"
              type="number" 
              name="precipitation" 
              placeholder="Enter precipitation" 
              value={formData.precipitation} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="FFMC" className="block text-sm font-medium text-gray-700 mb-1">
              FFMC
            </label>
            <input 
              id="FFMC"
              type="number" 
              name="FFMC" 
              placeholder="Enter FFMC" 
              value={formData.FFMC} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="DMC" className="block text-sm font-medium text-gray-700 mb-1">
              DMC
            </label>
            <input 
              id="DMC"
              type="number" 
              name="DMC" 
              placeholder="Enter DMC" 
              value={formData.DMC} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="DC" className="block text-sm font-medium text-gray-700 mb-1">
              DC
            </label>
            <input 
              id="DC"
              type="number" 
              name="DC" 
              placeholder="Enter DC" 
              value={formData.DC} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="ISI" className="block text-sm font-medium text-gray-700 mb-1">
              ISI
            </label>
            <input 
              id="ISI"
              type="number" 
              name="ISI" 
              placeholder="Enter ISI" 
              value={formData.ISI} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="BUI" className="block text-sm font-medium text-gray-700 mb-1">
              BUI
            </label>
            <input 
              id="BUI"
              type="number" 
              name="BUI" 
              placeholder="Enter BUI" 
              value={formData.BUI} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="FWI" className="block text-sm font-medium text-gray-700 mb-1">
              FWI
            </label>
            <input 
              id="FWI"
              type="number" 
              name="FWI" 
              placeholder="Enter FWI" 
              value={formData.FWI} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-300"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};


export default SimulationForm;
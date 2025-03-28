import React, { useState, useRef } from 'react';
import axios from 'axios';
import Map from '../components/Map';
import SimulationForm from '../components/SimulationForm';

// Simulation Point Modal Component
const SimulationPointModal = ({ 
  selectedPoint, 
  onClose, 
  onSubmit 
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-2xl mx-4 rounded-lg shadow-xl relative">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Content */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Selected Location: 
            <span className="text-blue-600 ml-2">
              ({selectedPoint.lat.toFixed(4)}, {selectedPoint.lon.toFixed(4)})
            </span>
          </h3>
          
          <SimulationForm
            lat={selectedPoint.lat}
            lon={selectedPoint.lon}
            onSubmit={(submittedData) => {
              onSubmit(submittedData);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};

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
    setSimulationList((prevList) => [...prevList, {
      ...submittedData,
      lat: selectedPoint.lat,
      lon: selectedPoint.lon
    }]);
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
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Create Simulation Data
        </h1>
        <p className="text-gray-600">Select a location and generate simulation data</p>
      </div>

      {/* Map Section */}
      <div className="mb-6 shadow-lg rounded-lg overflow-hidden">
        <Map
          ref={mapRef}
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          onClick={handleMapClick}
          className="w-full h-96"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mb-6">
        <button 
          onClick={handleDownload} 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-9.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span>Download Simulation Data</span>
        </button>
        <button 
          onClick={handleResetCenter} 
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v4h1V3a1 1 0 112 0v4h1V3a1 1 0 112 0v4h1V3a1 1 0 112 0v4h1a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h1zm-1 8v5a1 1 0 001 1h10a1 1 0 001-1v-5H4z" clipRule="evenodd" />
          </svg>
          <span>Reset to Home</span>
        </button>
      </div>

      {/* Simulation Data List */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Submitted Simulation Data
        </h3>
        {simulationList.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No data submitted yet</p>
        ) : (
          <div className="space-y-4">
            {simulationList.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between bg-gray-50 p-4 rounded-md border border-gray-200"
              >
                <div className="flex-grow pr-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Location:</span> 
                    Lat: {item.lat.toFixed(4)}, Lon: {item.lon.toFixed(4)}
                  </p>
                  <pre className="text-xs text-gray-600 mt-2 overflow-x-auto max-h-24 overflow-y-auto bg-gray-100 p-2 rounded">
                    {JSON.stringify(item.data, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={() => handleDelete(index)}
                  className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition-colors flex items-center space-x-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simulation Point Modal */}
      {selectedPoint && (
        <SimulationPointModal 
          selectedPoint={selectedPoint}
          onClose={() => setSelectedPoint(null)}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
};

export default Simulation;
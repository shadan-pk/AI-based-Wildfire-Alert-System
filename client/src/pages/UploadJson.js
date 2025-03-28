import React, { useState } from 'react';
import axios from 'axios';

const UploadJson = () => {
  const [file, setFile] = useState(null);
  const [collectionName, setCollectionName] = useState('');
  const [message, setMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!file || !collectionName) {
      setMessage('Please select a file and enter a collection name');
      return;
    }

    const formData = new FormData();
    formData.append('jsonFile', file);
    formData.append('collectionName', collectionName);
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setMessage('');

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/upload-json`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      setMessage(res.data.message || 'Upload successful');
      setIsUploading(false);
      setUploadProgress(100);
    } catch (error) {
      console.error('Full error:', error.response ? error.response.data : error);
      setMessage('Error uploading file');
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-lg p-8 mt-10">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Upload JSON for Wildfire Prediction
        </h1>
        <p className="text-gray-600">Select a JSON file and specify a collection name</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="collectionName" className="block text-sm font-medium text-gray-700 mb-2">
            Collection Name
          </label>
          <input
            id="collectionName"
            type="text"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            placeholder="Enter unique collection name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="jsonFile" className="block text-sm font-medium text-gray-700 mb-2">
            JSON File
          </label>
          <div className="flex items-center">
            <label className="flex-grow bg-gray-50 border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-blue-500 transition">
              <input
                id="jsonFile"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                required
              />
              <span className="text-gray-600">
                {file ? file.name : 'Click to select JSON file'}
              </span>
            </label>
          </div>
        </div>

        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={isUploading}
          className={`w-full py-3 rounded-md text-white font-semibold transition-colors duration-300 ${
            isUploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isUploading ? 'Uploading...' : 'Upload JSON'}
        </button>

        {message && (
          <div className={`mt-4 p-3 rounded-md text-center ${
            message.includes('successful') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default UploadJson;
import React, { useState } from 'react';
import axios from 'axios';

const UploadJson = () => {
  const [file, setFile] = useState(null);
  const [collectionName, setCollectionName] = useState('');
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !collectionName) {
      setMessage('Please select a file and enter a collection name');
      return;
    }
    const formData = new FormData();
    formData.append('jsonFile', file);
    formData.append('collectionName', collectionName);
    try {
      // Remove the extra /api from the URL
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/upload-json`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(res.data.message || res.data.error);
    } catch (error) {
      console.error('Full error:', error.response ? error.response.data : error);
      setMessage('Error uploading file');
    }
  };

  return (
    <div>
      <h1>Upload JSON File for Wildfire Prediction</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
          placeholder="Enter collection name"
        />
        <input type="file" accept=".json" onChange={handleFileChange} />
        <button type="submit">Upload</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default UploadJson;
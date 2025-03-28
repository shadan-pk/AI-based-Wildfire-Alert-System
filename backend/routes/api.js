const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { processJson } = require('../controllers/processJson');

// In-memory storage for simulation data
let simulationData = [];

router.post('/simulation', (req, res) => {
  try {
    const data = req.body;
    console.log('Simulation data received:', data);
    simulationData.push(data);
    res.status(201).json({ message: 'Simulation data received', data });
  } catch (err) {
    console.error('Simulation route error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/simulation/download', (req, res) => {
  try {
    if (simulationData.length === 0) {
      return res.status(404).json({ error: 'No simulation data available to download' });
    }
    res.setHeader('Content-Disposition', 'attachment; filename="simulation_data.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(simulationData, null, 2));
    simulationData = []; // Clear data after download
  } catch (err) {
    console.error('Download route error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/simulation/sync', (req, res) => {
  try {
    simulationData = req.body; // Overwrite backend data with frontend list
    console.log('Simulation data synced:', simulationData);
    res.status(200).json({ message: 'Simulation data synced' });
  } catch (err) {
    console.error('Sync route error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload-json', upload.single('jsonFile'), processJson);

module.exports = router;
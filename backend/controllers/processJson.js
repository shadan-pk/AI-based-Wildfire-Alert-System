const { spawn } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
const dbConnection = require('../database-connection');

const predictionSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  prediction: { type: Number, required: true, enum: [0, 1] },
});

exports.processJson = async (req, res) => {
  try {
    const collectionName = req.body.collectionName;
    if (!collectionName || typeof collectionName !== 'string') {
      return res.status(400).json({ error: 'Valid collection name is required' });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No JSON file uploaded' });
    }

    const jsonData = req.file.buffer.toString('utf8');
    const scriptPath = path.join(__dirname, '..', 'scripts', 'predict.py');
    const pythonProcess = spawn('python', [scriptPath]);

    pythonProcess.stdin.write(jsonData);
    pythonProcess.stdin.end();

    let predictions = '';
    pythonProcess.stdout.on('data', (chunk) => {
      predictions += chunk.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python error: ${data}`);
      return res.status(500).json({ error: `Python script error: ${data}` });
    });

    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: `Python script exited with code ${code}` });
      }

      try {
        const predictionArray = JSON.parse(predictions);
        
        // Use the function from the database connection module
        const predictionConnection = dbConnection.getPredictionConnection();
        
        const PredictionModel = predictionConnection.model('Prediction', predictionSchema, collectionName);
        await PredictionModel.insertMany(predictionArray);
        res.status(200).json({ message: `Predictions stored in collection '${collectionName}'` });
      } catch (error) {
        console.error('Error parsing predictions or saving to DB:', error);
        res.status(500).json({ error: `Failed to process predictions: ${error.message}` });
      }
    });
  } catch (error) {
    console.error('Process JSON error:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};
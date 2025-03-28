const { spawn } = require('child_process');
const path = require('path'); // Fix: Use built-in path module
const mongoose = require('mongoose');
const { predictionConnection } = require('../server');

const predictionSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  prediction: { type: Number, required: true, enum: [0, 1] },
});

exports.processJson = async (req, res) => {
  try {
    // Validate collection name
    const collectionName = req.body.collectionName;
    if (!collectionName || typeof collectionName !== 'string') {
      return res.status(400).json({ error: 'Valid collection name is required' });
    }
    
    // Validate file upload
    if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: 'No JSON file uploaded' });
    }
    
    const jsonData = req.file.buffer.toString('utf8');
    
    // Spawn Python process
    const scriptPath = path.join(__dirname, '..', 'scripts', 'predict.py');
    console.log('Script path:', scriptPath);
    const pythonProcess = spawn('python', [scriptPath]);

    // Send JSON data to Python script
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

        // Create a model for the user-specified collection
        const PredictionModel = predictionConnection.model('Prediction', predictionSchema, collectionName);

        // Insert predictions into the collection
        await PredictionModel.insertMany(predictionArray);

        res.status(200).json({ message: `Predictions stored in collection '${collectionName}'` });
      } catch (error) {
        console.error('Error parsing predictions or saving to DB:', error);
        res.status(500).json({ error: `Failed to process predictions: ${error.message}` });
      }
    });
  } catch (error) {
    console.error('Process JSON error:', error);
    console.log('Script path:', scriptPath);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};
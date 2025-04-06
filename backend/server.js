const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const dbConnection = require('./database-connection');
const { db } = require('./FirebaseConfig');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize MongoDB connection and start server
let predictionDb;
dbConnection.connect()
  .then((connection) => {
    predictionDb = connection;
    console.log('MongoDB connection established for prediction data');

    // Mount API routes from api.js after successful connection
    app.use('/api', apiRoutes);

    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// API to update user location in Firestore
app.post('/api/update-location', async (req, res) => {
  const { uid, lat, lon } = req.body;
  try {
    await db.collection('users').doc(uid).update({
      location: { lat, lon },
      updatedAt: require('firebase-admin').firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).send('Location updated');
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).send('Error updating location');
  }
});

// API to get list of scenarios from MongoDB
app.get('/api/scenarios', async (req, res) => {
  try {
    if (!predictionDb) {
      console.error('MongoDB connection not ready when fetching scenarios');
      throw new Error('MongoDB connection not ready');
    }
    console.log('Fetching collections from prediction database...');
    const collections = await predictionDb.db.listCollections().toArray();
    const scenarioNames = collections.map(col => col.name);
    console.log('Fetched scenarios:', scenarioNames);
    if (scenarioNames.length === 0) {
      console.warn('No collections found in the prediction database');
      return res.status(200).json([]); // Return empty array if no scenarios
    }
    res.json(scenarioNames);
  } catch (error) {
    console.error('Error fetching scenarios:', error.message);
    res.status(500).send('Error fetching scenarios');
  }
});

// API to get prediction data for a scenario from MongoDB
app.get('/api/scenario/:collectionName', async (req, res) => {
  const collectionName = req.params.collectionName;
  try {
    if (!predictionDb) throw new Error('MongoDB connection not ready');
    console.log(`Fetching data for scenario: ${collectionName}`);
    const collection = predictionDb.collection(collectionName);
    const data = await collection.find({}).toArray();
    console.log(`Fetched ${data.length} documents for scenario ${collectionName}`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching scenario data:', error.message);
    res.status(500).send('Error fetching scenario data');
  }
});

// API to store prediction data in MongoDB
app.post('/api/store-prediction', async (req, res) => {
  const { lat, lon, prediction, scenario } = req.body;
  try {
    if (!predictionDb) throw new Error('MongoDB connection not ready');
    const collection = predictionDb.collection(scenario || 'defaultScenario');
    await collection.insertOne({ lat, lon, prediction });
    console.log(`Stored prediction in ${scenario || 'defaultScenario'}:`, { lat, lon, prediction });
    res.status(200).send('Prediction stored successfully');
  } catch (error) {
    console.error('Error storing prediction:', error.message);
    res.status(500).send('Error storing prediction');
  }
});
// API to set the selected scenario and update Firebase
app.post('/api/set-selected-scenario', async (req, res) => {
  const { scenarioName } = req.body;

  if (!scenarioName) {
    return res.status(400).send('Scenario name is required');
  }

  try {
    if (!predictionDb) {
      throw new Error('MongoDB connection not ready');
    }

    // Fetch heatmap data from MongoDB
    const collection = predictionDb.collection(scenarioName);
    const data = await collection.find({}).toArray();

    // Process MongoDB data into a clean format for Firebase
    const heatmapData = data.map(point => {
      const lat = parseFloat(point.lat?.$numberDouble || point.lat);
      const lon = parseFloat(point.lon?.$numberDouble || point.lon);
      let prediction = 0;
      if (point.prediction?.$numberInt) {
        prediction = parseInt(point.prediction.$numberInt, 10);
      } else if (point.prediction?.$numberDouble) {
        prediction = parseFloat(point.prediction.$numberDouble);
      } else {
        prediction = parseInt(point.prediction || 0, 10);
      }
      return { lat, lon, prediction };
    }).filter(point => !isNaN(point.lat) && !isNaN(point.lon));

    // Update Firebase "selectedScenario" document
    await db.collection('selectedScenario').doc('current').set({
      scenarioName,
      selectedAt: new Date(),
      heatmapData
    });

    console.log(`Updated selectedScenario with ${heatmapData.length} points for ${scenarioName}`);
    res.status(200).send('Selected scenario updated');
  } catch (error) {
    console.error('Error setting selected scenario:', error.message);
    res.status(500).send('Error setting selected scenario');
  }
});


module.exports = app;
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

module.exports = app;
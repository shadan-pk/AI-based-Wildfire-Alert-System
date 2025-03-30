const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const dbConnection = require('./database-connection'); // Import the new database connection module
const { db } = require('./firebase-config');

const app = express();

app.use(cors());
app.use(express.json());

// Connect to the database before starting the server
let predictionDb;
dbConnection.connect()
  .then((connection) => {
    predictionDb = connection;
    console.log('MongoDB connection established for prediction data');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

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
    if (!predictionDb) throw new Error('MongoDB connection not ready');
    const collections = await predictionDb.db.listCollections().toArray();
    const scenarioNames = collections.map(col => col.name);
    res.json(scenarioNames);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    res.status(500).send('Error fetching scenarios');
  }
});

// API to get prediction data for a scenario from MongoDB
app.get('/api/scenario/:collectionName', async (req, res) => {
  const collectionName = req.params.collectionName;
  try {
    if (!predictionDb) throw new Error('MongoDB connection not ready');
    const collection = predictionDb.collection(collectionName);
    const data = await collection.find({}).toArray();
    res.json(data);
  } catch (error) {
    console.error('Error fetching scenario data:', error);
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
    res.status(200).send('Prediction stored successfully');
  } catch (error) {
    console.error('Error storing prediction:', error);
    res.status(500).send('Error storing prediction');
  }
});

module.exports = app;
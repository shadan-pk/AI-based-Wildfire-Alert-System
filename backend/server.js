const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();

// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// MongoDB connection to "prediction" database
const predictionConnectionPromise = mongoose.createConnection(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'prediction',
}).asPromise();

let predictionConnection;

predictionConnectionPromise
  .then((conn) => {
    predictionConnection = conn;
    console.log('predictionConnection initialized:', predictionConnection);
    predictionConnection.on('connected', () => console.log('Connected to prediction database'));
    predictionConnection.on('error', (err) => console.error('Prediction database connection error:', err));
  })
  .catch((err) => {
    console.error('Failed to initialize predictionConnection:', err);
  });

// Export predictionConnection and app
module.exports = {
  getPredictionConnection: () => {
    if (!predictionConnection) {
      throw new Error('predictionConnection not yet initialized');
    }
    return predictionConnection;
  },
  app,
};

// Routes
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();
app.use(express.json());

// Connect to the "prediction" database
const predictionConnection = mongoose.createConnection(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'prediction',
});

predictionConnection.on('connected', () => {
  console.log('Connected to prediction database');
});

predictionConnection.on('error', (err) => {
  console.error('Prediction database connection error:', err);
});

// Make the connection available to other files
module.exports = { predictionConnection, app };

// Set up routes
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Add this
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();

// Enable CORS for http://localhost:3000
app.use(cors({
  origin: 'http://localhost:3000', // Allow only this origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
  allowedHeaders: ['Content-Type'], // Allowed headers
}));

app.use(express.json());

const predictionConnection = mongoose.createConnection(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'prediction',
});

predictionConnection.on('connected', () => console.log('Connected to prediction database'));
predictionConnection.on('error', (err) => console.error('Prediction database connection error:', err));

module.exports = { predictionConnection, app };

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
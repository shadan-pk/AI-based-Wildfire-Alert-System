const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Create a module that manages the database connection
class DatabaseConnection {
  constructor() {
    this.predictionConnection = null;
  }

  async connect() {
    try {
      this.predictionConnection = await mongoose.createConnection(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: 'prediction',
      });

      // console.log('predictionConnection initialized:', this.predictionConnection);
      
      this.predictionConnection.on('connected', () => 
        console.log('Connected to prediction database')
      );
      
      this.predictionConnection.on('error', (err) => 
        console.error('Prediction database connection error:', err)
      );

      return this.predictionConnection;
    } catch (err) {
      console.error('Failed to initialize predictionConnection:', err);
      throw err;
    }
  }

  getPredictionConnection() {
    if (!this.predictionConnection) {
      throw new Error('Prediction connection not initialized. Call connect() first.');
    }
    return this.predictionConnection;
  }
}

module.exports = new DatabaseConnection();
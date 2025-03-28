const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Added for frontend-backend communication
const simulationRoutes = require('./routes/api');
// require('dotenv').config(); // Added to load environment variables

const app = express();

// Middleware
app.use(cors()); // Allows requests from your React frontend
app.use(express.json()); // Parses JSON request bodies
app.use('/api', simulationRoutes); // Mounts API routes

// MongoDB Atlas connection using environment variable
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
//   .then(() => console.log('Connected to MongoDB Atlas'))
//   .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000; // Use PORT from .env or default to 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
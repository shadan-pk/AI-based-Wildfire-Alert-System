const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const dbConnection = require('./database-connection'); // Import the new database connection module

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Connect to the database before starting the server
dbConnection.connect()
  .then(() => {
    app.use('/api', apiRoutes);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });

module.exports = app;
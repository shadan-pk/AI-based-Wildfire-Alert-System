const express = require('express');
const router = express.Router();
const SimulationData = require('../models/SimulationData');

// POST route to save simulation data
router.post('/simulation', async (req, res) => {
  try {
    const simulation = new SimulationData(req.body);
    await simulation.save();
    res.status(201).send(simulation); // Respond with the saved data
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
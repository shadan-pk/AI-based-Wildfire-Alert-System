const mongoose = require('mongoose');

const simulationDataSchema = new mongoose.Schema({
  lat: Number,
  lon: Number,
  data: {
    Temperature: Number,
    RH: Number,
    Ws: Number,
    Rain: Number,
    FFMC: Number,
    DMC: Number,
    DC: Number,
    ISI: Number,
    BUI: Number,
    FWI: Number,
  },
});

module.exports = mongoose.model('SimulationData', simulationDataSchema);
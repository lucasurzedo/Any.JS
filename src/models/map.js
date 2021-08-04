const mongoose = require('mongoose');

const MapSchema = mongoose.Schema({
  mapName: String,
  key: String,
  value: Object,
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = MapSchema;

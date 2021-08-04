const mongoose = require('mongoose');

const MapSchema = mongoose.Schema({
  mapName: String,
  objectName: String,
  object: Object,
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = MapSchema;

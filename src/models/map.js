const mongoose = require('mongoose');

const MapSchema = mongoose.Schema({
  key: String,
  value: Object,
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = MapSchema;

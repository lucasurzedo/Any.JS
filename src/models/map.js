const mongoose = require('mongoose');

const MapSchema = mongoose.Schema({
  key: String,
  value: Object,
  type: String,
  lockedKeys: Object,
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = MapSchema;

const mongoose = require('mongoose');

const RegisterSchema = mongoose.Schema({
  codeName: String,
  language: String,
  code: Object,
  notes: String,
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = RegisterSchema;

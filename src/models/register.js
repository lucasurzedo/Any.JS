const mongoose = require('mongoose');

const RegisterSchema = mongoose.Schema({
  codeName: String,
  language: String,
  code: Object,
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = RegisterSchema;

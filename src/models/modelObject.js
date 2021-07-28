const mongoose = require('mongoose');

const ObjectSchema = mongoose.Schema({
  className: String,
  objectName: String,
  author: String,
  object: Object,
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = ObjectSchema;

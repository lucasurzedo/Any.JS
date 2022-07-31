const mongoose = require('mongoose');

const ObjectSchema = mongoose.Schema({
  className: String,
  objectName: String,
  object: Object,
  type: String,
  locked: String,
  lockQueue: Object,
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = ObjectSchema;

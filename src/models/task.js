const mongoose = require('mongoose');

const TaskSchema = mongoose.Schema({
  executionName: String,
  parameterValue: Object,
  method: String,
  methodArgs: Object,
  taskResult: Object,
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = TaskSchema;

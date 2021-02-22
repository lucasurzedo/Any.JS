const mongoose = require('mongoose');

const TaskSchema = mongoose.Schema({
    taskName: String,
    language: String,
    author: String,
    content: Object,
    executionName: String,
    parameterValue: Object,
    taskResult: Object,
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = TaskSchema
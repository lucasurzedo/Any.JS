const mongoose = require('mongoose');

const TaskSchema = mongoose.Schema({
    taskName: String,
    parameterName: String,
    language: String,
    author: String,
    content: Object,
    parameterValue: Object,
    taskResult: Object,
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Tasks', TaskSchema)
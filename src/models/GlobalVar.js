const mongoose = require('mongoose');

const GlobalVarSchema = mongoose.Schema({
    name: String,
    type: String,
    author: String,
    content: Object,
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('GlobalVars', GlobalVarSchema)
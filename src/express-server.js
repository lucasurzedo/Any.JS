'use strict';

const express = require('express');
const app = express();
const routes = require('./routes');
const mongoose = require('mongoose');

exports.setupApp = async function setupApp() {
	app.use(express.json());

	app.use('/api/anyJS', routes);

	mongoose.connect('mongodb://db:27017/anyjs-db', { useNewUrlParser: true, useUnifiedTopology: true }, () => 
		console.log('Connected to DB!')
	);

	return app;
};

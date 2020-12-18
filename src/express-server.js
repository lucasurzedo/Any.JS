'use strict';

const express = require('express');
const app = express();
const routes = require('./routes');
const mongoose = require('mongoose');
require('dotenv/config')

exports.setupApp = async function setupApp() {
	app.use(express.json());

	app.use('/api', routes);

	mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true }, () => 
		console.log('Connected to DB!')
	);

	return app;
};

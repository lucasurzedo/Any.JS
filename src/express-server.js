const express = require('express');

const app = express();
const mongoose = require('mongoose');
const routes = require('./routes');
require('dotenv/config');

exports.setupApp = async function setupApp() {
  app.use(express.json());

  app.use('/api/anyJS/v1', routes);

  mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true }, () => console.log('Connected to DB!'));

  return app;
};

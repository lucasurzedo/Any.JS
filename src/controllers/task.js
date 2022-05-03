const mongoose = require('mongoose');
const fs = require('fs');
const ModelTask = require('../models/task');
const db = require('../db');
const utils = require('../utils/index');
const executeFunction = require('../services/executeFunction');

async function createTask(req, res) {
  if (!req.body.taskName || !req.body.code || !req.body.args
      || !req.body.method || !req.body.methodArgs) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}/${req.body.objectName}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);
    return;
  }

  const registerCollection = 'registers';

  // Try to find the code in collection registers
  const documentCode = await db.getDocument(registerCollection, 'codeName', req.body.code);

  if (!documentCode) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no code ${req.params.codeName}`,
    };
    res.status(404).send(jsonError);
  }

  const codes = [];
  const methodsLinks = [];
  // Get all the codes names and links
  for (const iterator of documentCode.code) {
    codes.push(iterator);
  }

  // Separate names and links in a object
  for (let i = 0; i < codes.length; i += 1) {
    for (const key in codes[i]) {
      methodsLinks.push({ name: key, link: codes[i][key] });
    }
  }

  // Verify if the file already exists
  for (let i = 0; i < methodsLinks.length; i += 1) {
    const path = `./src/codes/${methodsLinks[i].name}.js`;

    if (fs.existsSync(path)) {
      methodsLinks.splice(i, 1);
      i -= 1;
    }
  }

  const collectionName = (`${req.body.code}_task`).toLowerCase();

  const document = await db.getDocument(collectionName, 'executionName', req.body.taskName);

  if (document) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}${req.body.taskName}`,
      result: `execution ${req.body.taskName} already exist`,
    };
    res.status(409).send(jsonResult);
    return;
  }

  const Task = mongoose.model(collectionName, ModelTask, collectionName);

  const newTask = new Task({
    executionName: req.body.taskName,
    parameterValue: req.body.args,
    method: req.body.method,
    methodArgs: req.body.methodArgs,
    taskResult: null,
  });

  await newTask.save();

  // If the file don't exists then its downloaded and executed
  // If the file exists then its executed
  if (methodsLinks.length > 0) {
    console.log('Downloading codes');
    const code = await utils.downloadCode(methodsLinks);
    if (code) {
      const jsonResult = {
        uri: `${req.baseUrl}${req.url}/${req.body.taskName}`,
        result: 'saving execution',
      };
      res.status(201).send(jsonResult);

      executeFunction(req.body).then((result) => {
        console.log(result);
        newTask.taskResult = result;
        newTask.save();
      });
    }
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}/${req.body.code}/execution/${req.body.taskName}`.toLowerCase(),
      result: 'saving execution',
    };
    res.status(201).send(jsonResult);

    executeFunction(req.body).then((result) => {
      console.log(result);
      newTask.taskResult = result;
      newTask.save();
    });
  }
}

async function getAllTaskExecutions(req, res) {
  const collectionName = (`${req.params.taskName}_task`).toLowerCase();

  const documents = await db.getAllDocuments(collectionName);

  const executions = [];
  for (const iterator of documents) {
    executions.push(iterator);
  }

  if (executions.length === 0) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no executions in task ${req.params.taskName}`,
    };
    res.status(404).send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      executions,
    };
    res.status(200).send(jsonResult);
  }
}

async function getExecution(req, res) {
  const collectionName = (`${req.params.taskName}_task`).toLowerCase();

  const document = await db.getDocument(collectionName, 'executionName', req.params.executionName);

  if (document) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: document,
    };

    res.status(200).send(jsonResult);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no execution ${req.params.executionName}`,
    };
    res.status(404).send(jsonError);
  }
}

async function deleteTask(req, res) {
  const collectionName = (`${req.params.taskName}_task`).toLowerCase();

  const result = await db.dropCollection(collectionName);

  if (result) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `task ${req.params.taskName} deleted`,
    };
    res.status(200).send(jsonResult);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no task ${collectionName}`,
    };
    res.status(404).send(jsonError);
  }
}

async function deleteExecution(req, res) {
  const collectionName = (`${req.params.taskName}_task`).toLowerCase();

  const deleted = await db.deleteDocument(collectionName, 'executionName', req.params.executionName);

  if (deleted) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `execution ${req.params.executionName} removed`,
    };
    res.status(200).send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `execution ${req.params.executionName} do not exist`,
    };
    res.status(404).send(jsonResult);
  }
}

module.exports = {
  createTask,
  getAllTaskExecutions,
  getExecution,
  deleteTask,
  deleteExecution,
};

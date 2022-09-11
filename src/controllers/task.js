const mongoose = require('mongoose');
const fs = require('fs');
const ModelTask = require('../models/task');
const db = require('../db');
const utils = require('../utils/index');
const executeFunction = require('../services/executeFunction');

async function createTask(req, res) {
  const {
    taskName,
    code,
    args,
    mainClassPath,
    method,
    methodArgs,
  } = req.body;

  const {
    language,
  } = req.params;

  if (!taskName || !code || !args || !method || !methodArgs || !language) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);
    return;
  }

  const collectionName = (`${code}_task`).toLowerCase();

  const document = await db.getDocument(collectionName, 'executionName', taskName);

  if (document) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}${taskName}`,
      result: `execution ${taskName} already exists`,
    };
    res.status(409).send(jsonResult);
    return;
  }

  // Try to find the code in collection registers
  const documentCode = await db.getDocument('registers', 'codeName', code);

  if (!documentCode) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no code ${code}`,
    };
    res.status(404).send(jsonError);
    return;
  }

  const codes = documentCode.code;
  const methodsLinks = [];

  // Separate names and links in a object
  for (let i = 0; i < codes.length; i += 1) {
    for (const key in codes[i]) {
      methodsLinks.push({ name: key, link: codes[i][key] });
    }
  }

  const DIRECTORY = {
    javascript: './src/codes/',
    java: './src/classes/',
    python: './src/codes/',
  }

  const FILETYPE = {
    javascript: '.js',
    java: '.jar',
    python: 'py',
  }

  // Verify if the file already exists
  for (let i = 0; i < methodsLinks.length; i += 1) {
    let path = `${DIRECTORY[language]}${methodsLinks[i].name}${FILETYPE[language]}`;

    if (fs.existsSync(path)) {
      methodsLinks.splice(i, 1);
      i -= 1;
    }
  }

  const Task = mongoose.model(collectionName, ModelTask, collectionName);

  const newTask = new Task({
    executionName: taskName,
    parameterValue: args,
    method: method,
    methodArgs: methodArgs,
    taskResult: null,
  });

  // If the file don't exist then its downloaded and executed
  // If the file exists then its executed
  if (methodsLinks.length > 0) {
    console.log('Downloading codes');
    const code = await utils.downloadCode(methodsLinks, language);
    if (code) {
      await newTask.save();
      const jsonResult = {
        uri: `${req.baseUrl}${req.url}/${code}/${taskName}`.toLowerCase(),
        result: 'saving execution',
      };
      res.status(201).send(jsonResult);

      executeFunction({ args, code, mainClassPath, method, methodArgs, language }).then((result) => {
        console.log(result);
        newTask.taskResult = result;
        newTask.save();
      });
    } else {
      const jsonResult = {
        uri: `${req.baseUrl}${req.url}/${code}/${taskName}`.toLowerCase(),
        result: 'error downloading the codes',
      };
      res.status(400).send(jsonResult);
    }
  } else {
    await newTask.save();
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}/${code}/${taskName}`.toLowerCase(),
      result: 'saving execution',
    };
    res.status(201).send(jsonResult);

    executeFunction({ args, code, mainClassPath, method, methodArgs, language }).then((result) => {
      console.log(result);
      newTask.taskResult = result;
      newTask.save();
    });
  }
}

async function updateCreatedTask(req, res) {

}

async function getAllTaskExecutions(req, res) {
  const {
    taskName,
  } = req.params;

  const collectionName = (`${taskName}_task`).toLowerCase();

  const documents = await db.getAllDocuments(collectionName);

  const executions = [];
  for (const iterator of documents) {
    executions.push(iterator);
  }

  if (executions.length === 0) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no executions in task ${taskName}`,
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
  const {
    taskName,
    executionName,
  } = req.params;

  const collectionName = (`${taskName}_task`).toLowerCase();

  const document = await db.getDocument(collectionName, 'executionName', executionName);

  if (document) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: document,
    };

    res.status(200).send(jsonResult);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no execution ${executionName}`,
    };
    res.status(404).send(jsonError);
  }
}

async function deleteTask(req, res) {
  const {
    taskName,
  } = req.params;

  const collectionName = (`${taskName}_task`).toLowerCase();

  const result = await db.dropCollection(collectionName);

  if (result) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `task ${taskName} deleted`,
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
  const {
    taskName,
    executionName,
  } = req.params;

  const collectionName = (`${taskName}_task`).toLowerCase();

  const deleted = await db.deleteDocument(collectionName, 'executionName', executionName);

  if (deleted) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `execution ${executionName} removed`,
    };
    res.status(200).send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `execution ${executionName} do not exist`,
    };
    res.status(404).send(jsonResult);
  }
}

module.exports = {
  createTask,
  updateCreatedTask,
  getAllTaskExecutions,
  getExecution,
  deleteTask,
  deleteExecution,
};

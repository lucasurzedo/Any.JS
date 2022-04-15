const mongoose = require('mongoose');
const ModelMap = require('../models/map');
const ModelTask = require('../models/task');
const db = require('../db');
const executeFunction = require('../services/executeFunction');

async function setElement(req, res) {
  if (!req.body.mapName || !req.body.key || !req.body.value) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
      status: 400,
    };

    res.send(jsonError);

    return;
  }

  let mapName = `${req.body.mapName}`;
  mapName = mapName.toLowerCase();
  req.body.mapName = mapName;

  const collectionName = (`${req.body.mapName}_map`).toLowerCase();

  const document = await db.getDocument(collectionName, 'key', req.body.key);

  if (document) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'duplicate key',
      status: 409,
    };
    res.send(jsonError);
  } else {
    const Element = mongoose.model(collectionName, ModelMap, collectionName);

    const newElement = new Element({
      mapName: req.body.mapName,
      key: req.body.key,
      value: req.body.value,
    });

    newElement.save();

    const jsonResult = {
      result: `${req.baseUrl}${req.url}/${req.body.mapName}`,
      status: 201,
    };
    res.send(jsonResult);
  }
}

async function updateElement(req, res) {
  if (!req.body.mapName || !req.body.key || !req.body.value) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
      status: 400,
    };

    res.send(jsonError);

    return;
  }

  const newValues = {
    $set: { key: req.body.key, value: req.body.value },
    $currentDate: { lastModified: true },
  };

  const query = {};
  query.key = req.body.key;

  const collectionName = (`${req.body.mapName}_map`).toLowerCase();

  const updated = await db.updateDocument(collectionName, query, newValues);

  if (updated.modifiedCount > 0) {
    const jsonResult = {
      uri: `${req.baseUrl}/map/get/${req.body.mapName}/${req.body.key}`,
      status: 200,
    };

    res.send(jsonResult);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no key ${req.body.key}`,
      status: 404,
    };
    res.send(jsonError);
  }
}

async function updateMap(req, res) {
  if (!req.body.mapName || !req.body.map) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
      status: 400,
    };

    res.send(jsonError);

    return;
  }

  const collectionName = (`${req.body.mapName}_map`).toLowerCase();

  await db.dropCollection(collectionName);

  for (const element in req.body.map) {
    try {
      const Element = mongoose.model(collectionName, ModelMap, collectionName);

      const newElement = new Element({
        mapName: req.body.mapName,
        key: element,
        value: req.body.map[element],
      });

      newElement.save();
    } catch (error) {
      const jsonError = {
        uri: `${req.baseUrl}${req.url}`,
        result: 'error during update process',
        status: 500,
      };
      res.send(jsonError);
      return;
    }
  }

  const jsonResult = {
    result: `${req.baseUrl}${req.url}/${req.body.mapName}`,
    status: 201,
  };
  res.send(jsonResult);
}

async function mapForEach(req, res) {
  if (!req.body.mapName || !req.body.code || !req.body.args
    || !req.body.method) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
      status: 400,
    };

    res.send(jsonError);
    return;
  }

  let collectionName = (`${req.body.mapName}_map`).toLowerCase();

  const documents = await db.getAllDocuments(collectionName);

  const results = [];
  for (const iterator of documents) {
    const obj = {};
    obj[iterator.key] = `${req.baseUrl}/execute/task/${req.body.mapName}/execution/${iterator.key}`;
    results.push(obj);
  }

  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
    results,
    status: 200,
  };
  res.send(jsonResult);

  collectionName = (`${req.body.mapName}_map_task`).toLowerCase();

  const Task = mongoose.model(collectionName, ModelTask, collectionName);

  for (const iterator of documents) {
    req.body.methodArgs = [];
    req.body.methodArgs.push(iterator.value);

    const newTask = new Task({
      executionName: iterator.key,
      parameterValue: req.body.args,
      method: req.body.method,
      methodArgs: req.body.methodArgs,
      taskResult: null,
    });

    // eslint-disable-next-line no-await-in-loop
    await newTask.save();

    executeFunction(req.body).then((result) => {
      newTask.taskResult = result;
      newTask.save();
    });
  }
}

async function getElement(req, res) {
  let mapName = `${req.params.mapName}`;
  mapName = mapName.toLowerCase();
  req.params.mapName = mapName;

  const collectionName = (`${req.params.mapName}_map`).toLowerCase();

  const document = await db.getDocument(collectionName, 'key', req.params.key);

  if (!document) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no key ${req.params.key}`,
      status: 404,
    };
    res.send(jsonError);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: document.value,
      status: 200,
    };

    res.send(jsonResult);
  }
}

async function getEntries(req, res) {
  const collectionName = (`${req.params.mapName}_map`).toLowerCase();

  const documents = await db.getAllDocuments(collectionName);

  const elements = [];

  for (const iterator of documents) {
    const obj = {};
    obj[iterator.key] = iterator.value;
    elements.push(obj);
  }

  if (elements.length === 0) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no elements in map ${req.params.mapName}`,
      status: 404,
    };
    res.send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      elements,
      status: 200,
    };
    res.send(jsonResult);
  }
}

async function hasElement(req, res) {
  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
  };

  const collectionName = (`${req.params.mapName}_map`).toLowerCase();

  const document = await db.getDocument(collectionName, 'key', req.params.key);

  jsonResult.status = 200;
  if (document) {
    jsonResult.result = true;
    res.send(jsonResult);
  } else {
    jsonResult.result = false;
    res.send(jsonResult);
  }
}

async function getAllKeys(req, res) {
  const collectionName = (`${req.params.mapName}_map`).toLowerCase();

  const documents = await db.getAllDocuments(collectionName);

  const elements = [];

  for (const iterator of documents) {
    elements.push(iterator.key);
  }

  if (elements.length === 0) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no elements in map ${req.params.mapName}`,
      status: 404,
    };
    res.send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      keys: elements,
      status: 200,
    };
    res.send(jsonResult);
  }
}

async function getAllValues(req, res) {
  const collectionName = (`${req.params.mapName}_map`).toLowerCase();

  const documents = await db.getAllDocuments(collectionName);

  const elements = [];

  for (const iterator of documents) {
    elements.push(iterator.value);
  }

  if (elements.length === 0) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no elements in map ${req.params.mapName}`,
      status: 404,
    };
    res.send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      values: elements,
      status: 200,
    };
    res.send(jsonResult);
  }
}

async function deleteKey(req, res) {
  const collectionName = (`${req.params.mapName}_map`).toLowerCase();

  const deleted = await db.deleteDocument(collectionName, 'key', req.params.key);

  if (deleted) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `element ${req.params.key} removed`,
      status: 200,
    };
    res.send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `element ${req.params.key} do not exist`,
      status: 404,
    };
    res.send(jsonResult);
  }
}

async function clearMap(req, res) {
  const collectionName = (`${req.params.mapName}_map`).toLowerCase();

  const result = await db.dropCollection(collectionName);

  if (result) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `map ${req.params.mapName} deleted`,
      status: 200,
    };
    res.send(jsonResult);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no map ${collectionName}`,
      status: 404,
    };
    res.send(jsonError);
  }
}

module.exports = {
  setElement,
  updateElement,
  updateMap,
  mapForEach,
  getElement,
  getEntries,
  hasElement,
  getAllKeys,
  getAllValues,
  deleteKey,
  clearMap,
};

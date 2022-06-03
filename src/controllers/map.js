const mongoose = require('mongoose');
const ModelMap = require('../models/map');
const ModelTask = require('../models/task');
const db = require('../db');
const executeFunction = require('../services/executeFunction');

async function createMap(req, res) {
  if (!req.body.mapName) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);

    return;
  }

  const collectionName = (`${req.body.mapName}_map`).toLowerCase();

  const collectionExists = await db.hasCollection(collectionName);

  if (collectionExists) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'duplicated map',
    };
    res.status(409).send(jsonError);
  } else {
    const collection = await db.createCollection(collectionName);

    if (collection) {
      const jsonResult = {
        result: `${req.baseUrl}${req.url}/${req.body.mapName}`,
      };
      res.status(201).send(jsonResult);
    } else {
      const jsonResult = {
        result: `${req.baseUrl}${req.url}/${req.body.mapName}`,
        error: 'error during creation process',
      };
      res.status(500).send(jsonResult);
    }
  }
}

async function setElements(req, res) {
  if (!req.body.mapName || !req.body.elements) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);

    return;
  }

  const collectionName = (`${req.body.mapName}_map`).toLowerCase();
  const elements = req.body.elements;

  for (const element of elements) {
    // eslint-disable-next-line no-await-in-loop
    const document = await db.getDocument(collectionName, 'key', element.key);

    if (!document) {
      const Element = mongoose.model(collectionName, ModelMap, collectionName);

      const newElement = new Element({
        key: element.key,
        value: element.value,
      });

      newElement.save();
    }
  }

  const jsonResult = {
    result: `${req.baseUrl}${req.url}/entries/${req.body.mapName}`,
  };

  res.status(201).send(jsonResult);
}

async function setEntry(req, res) {
  if (!req.body.mapName || !req.body.key || !req.body.value) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);

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
    };
    res.status(409).send(jsonError);
  } else {
    const Element = mongoose.model(collectionName, ModelMap, collectionName);

    const newElement = new Element({
      key: req.body.key,
      value: req.body.value,
    });

    newElement.save();

    const jsonResult = {
      result: `${req.baseUrl}${req.url}/${req.body.mapName}`,
    };
    res.status(201).send(jsonResult);
  }
}

async function updateElement(req, res) {
  if (!req.body.mapName || !req.body.key || !req.body.value) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);

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
    };

    res.status(200).send(jsonResult);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no key ${req.body.key}`,
    };
    res.status(404).send(jsonError);
  }
}

async function updateMap(req, res) {
  if (!req.body.mapName || !req.body.map) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);

    return;
  }

  const collectionName = (`${req.body.mapName}_map`).toLowerCase();

  await db.dropCollection(collectionName);

  for (const element in req.body.map) {
    try {
      const Element = mongoose.model(collectionName, ModelMap, collectionName);

      const newElement = new Element({
        key: element,
        value: req.body.map[element],
      });

      newElement.save();
    } catch (error) {
      const jsonError = {
        uri: `${req.baseUrl}${req.url}`,
        result: 'error during update process',
      };
      res.status(500).send(jsonError);
      return;
    }
  }

  const jsonResult = {
    result: `${req.baseUrl}${req.url}/${req.body.mapName}`,
  };
  res.status(201).send(jsonResult);
}

async function mapForEach(req, res) {
  if (!req.body.mapName || !req.body.code || !req.body.args
    || !req.body.method) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);
    return;
  }

  let collectionName = (`${req.body.mapName}_map`).toLowerCase();

  const documents = await db.getAllDocuments(collectionName);

  const results = {};
  for (const iterator of documents) {
    results[iterator.key] = `${req.baseUrl}/execute/task/${req.body.mapName}/execution/${iterator.key}`;
  }

  console.log(results);

  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
    results,
  };
  res.status(200).send(jsonResult);

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
  const collectionName = (`${req.params.mapName}_map`).toLowerCase();

  const document = await db.getDocument(collectionName, 'key', req.params.key);

  if (!document) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no key ${req.params.key}`,
    };
    res.status(404).send(jsonError);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: document.value,
    };

    res.status(200).send(jsonResult);
  }
}

async function getEntries(req, res) {
  const collectionName = (`${req.params.mapName}_map`).toLowerCase();

  const documents = await db.getAllDocuments(collectionName);

  if (documents.length === 0) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no elements in map ${req.params.mapName}`,
    };
    res.status(404).send(jsonResult);
  } else {
    const entries = {};

    for (const iterator of documents) {
      entries[iterator.key] = iterator.value;
    }

    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      entries,
    };
    res.status(200).send(jsonResult);
  }
}

async function hasElement(req, res) {
  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
  };

  const collectionName = (`${req.params.mapName}_map`).toLowerCase();

  const document = await db.getDocument(collectionName, 'key', req.params.key);

  if (document) {
    jsonResult.result = true;
    res.status(200).send(jsonResult);
  } else {
    jsonResult.result = false;
    res.status(200).send(jsonResult);
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
    };
    res.status(404).send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      keys: elements,
    };
    res.status(200).send(jsonResult);
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
    };
    res.status(404).send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      values: elements,
    };
    res.status(200).send(jsonResult);
  }
}

async function deleteKey(req, res) {
  const collectionName = (`${req.params.mapName}_map`).toLowerCase();

  const deleted = await db.deleteDocument(collectionName, 'key', req.params.key);

  if (deleted) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `element ${req.params.key} removed`,
    };
    res.status(200).send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `element ${req.params.key} do not exist`,
    };
    res.status(404).send(jsonResult);
  }
}

async function deleteAllEntries(req, res) {
  const collectionName = (`${req.params.mapName}_map`).toLowerCase();

  const deleted = await db.deleteAllDocuments(collectionName);

  if (deleted) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'all elements removed',
    };
    res.status(200).send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no elements in map ${req.params.mapName}`,
    };
    res.status(404).send(jsonResult);
  }
}

async function deleteMap(req, res) {
  const collectionName = (`${req.params.mapName}_map`).toLowerCase();

  const result = await db.dropCollection(collectionName);

  if (result) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `map ${req.params.mapName} deleted`,
    };
    res.status(200).send(jsonResult);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no map ${collectionName}`,
    };
    res.status(404).send(jsonError);
  }
}

module.exports = {
  createMap,
  setElements,
  setEntry,
  updateElement,
  updateMap,
  mapForEach,
  getElement,
  getEntries,
  hasElement,
  getAllKeys,
  getAllValues,
  deleteKey,
  deleteAllEntries,
  deleteMap,
};

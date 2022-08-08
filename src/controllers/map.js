const mongoose = require('mongoose');
const ModelMap = require('../models/map');
const ModelTask = require('../models/task');
const db = require('../db');
const executeFunction = require('../services/executeFunction');

async function createMap(req, res) {
  const {
    mapName,
  } = req.body;

  if (!mapName) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);

    return;
  }

  const collectionName = (`${mapName}_map`).toLowerCase();

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
        result: `${req.baseUrl}${req.url}/${mapName}`,
      };
      res.status(201).send(jsonResult);
    } else {
      const jsonResult = {
        result: `${req.baseUrl}${req.url}/${mapName}`,
        error: 'error during creation process',
      };
      res.status(500).send(jsonResult);
    }
  }
}

async function setElements(req, res) {
  const {
    mapName,
    elements,
  } = req.body;

  if (!mapName || !elements) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);

    return;
  }

  const collectionName = (`${mapName}_map`).toLowerCase();

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
    result: `${req.baseUrl}${req.url}/entries/${mapName}`,
  };

  res.status(201).send(jsonResult);
}

async function setEntry(req, res) {
  const {
    mapName,
    key,
    value,
  } = req.body;

  if (!mapName || !key || !value) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);

    return;
  }

  const collectionName = (`${mapName}_map`).toLowerCase();
  const document = await db.getDocument(collectionName, 'key', key);

  if (document) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'duplicate key',
    };
    res.status(409).send(jsonError);
  } else {
    const Element = mongoose.model(collectionName, ModelMap, collectionName);

    const newElement = new Element({
      key: key,
      value: value,
    });

    newElement.save();

    const jsonResult = {
      result: `${req.baseUrl}${req.url}/${mapName}`,
    };
    res.status(201).send(jsonResult);
  }
}

async function updateElement(req, res) {
  const {
    mapName,
    key,
    value,
    identifier
  } = req.body;

  if (!mapName || !key || !value) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);

    return;
  }

  const collectionName = (`${mapName}_map`).toLowerCase();
  const lockMetadata = await db.getDocument(collectionName, 'type', 'lockMetadata');

  if (lockMetadata && lockMetadata.lockedKeys[key].locked !== identifier) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `map entry locked, entry cannot be updated`,
    };

    res.status(403).send(jsonResult);
    return;
  }

  const newValues = {
    $set: { key: key, value: value },
    $currentDate: { lastModified: true },
  };

  const query = {};
  query.key = key;


  const updated = await db.updateDocument(collectionName, query, newValues);

  if (updated.modifiedCount > 0) {
    const jsonResult = {
      uri: `${req.baseUrl}/map/get/${mapName}/${key}`,
    };

    res.status(200).send(jsonResult);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no key ${key}`,
    };
    res.status(404).send(jsonError);
  }
}

async function updateMap(req, res) {
  const {
    mapName,
    map,
  } = req.body;

  if (!mapName || !map) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);

    return;
  }

  const collectionName = (`${mapName}_map`).toLowerCase();
  await db.dropCollection(collectionName);

  for (const element in map) {
    try {
      const Element = mongoose.model(collectionName, ModelMap, collectionName);

      const newElement = new Element({
        key: element,
        value: map[element],
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
    result: `${req.baseUrl}${req.url}/${mapName}`,
  };
  res.status(201).send(jsonResult);
}

async function mapForEach(req, res) {
  const {
    mapName,
    code,
    args,
    method,
    methodArgs,
  } = req.body;

  if (!mapName || !code || !args
    || !method) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);
    return;
  }

  let collectionName = (`${mapName}_map`).toLowerCase();

  const documents = await db.getAllDocuments(collectionName);

  const results = {};
  for (const iterator of documents) {
    results[iterator.key] = `${req.baseUrl}/execute/task/${mapName}/execution/${iterator.key}`;
  }

  console.log(results);

  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
    results,
  };
  res.status(200).send(jsonResult);

  collectionName = (`${mapName}_map_task`).toLowerCase();

  const Task = mongoose.model(collectionName, ModelTask, collectionName);

  for (const iterator of documents) {
    methodArgs = [];
    methodArgs.push(iterator.value);

    const newTask = new Task({
      executionName: iterator.key,
      parameterValue: args,
      method: method,
      methodArgs: methodArgs,
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
  const {
    mapName,
    key,
  } = req.params;

  const collectionName = (`${mapName}_map`).toLowerCase();
  const document = await db.getDocument(collectionName, 'key', key);

  if (!document) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no key ${key}`,
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
  const {
    mapName,
  } = req.params;

  const collectionName = (`${mapName}_map`).toLowerCase();

  const documents = await db.getAllDocuments(collectionName);

  if (documents.length === 0) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no elements in map ${mapName}`,
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
  const {
    mapName,
    key,
  } = req.params;

  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
  };

  const collectionName = (`${mapName}_map`).toLowerCase();
  const document = await db.getDocument(collectionName, 'key', key);

  if (document) {
    jsonResult.result = true;
    res.status(200).send(jsonResult);
  } else {
    jsonResult.result = false;
    res.status(200).send(jsonResult);
  }
}

async function getAllKeys(req, res) {
  const {
    mapName,
  } = req.params;

  const collectionName = (`${mapName}_map`).toLowerCase();

  const documents = await db.getAllDocuments(collectionName);

  const elements = [];

  for (const iterator of documents) {
    elements.push(iterator.key);
  }

  if (elements.length === 0) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no elements in map ${mapName}`,
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
  const {
    mapName,
  } = req.params;

  const collectionName = (`${mapName}_map`).toLowerCase();
  const documents = await db.getAllDocuments(collectionName);

  const elements = [];
  for (const iterator of documents) {
    elements.push(iterator.value);
  }

  if (elements.length === 0) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no elements in map ${mapName}`,
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
  const {
    mapName,
    key,
  } = req.params;

  const collectionName = (`${mapName}_map`).toLowerCase();
  const deleted = await db.deleteDocument(collectionName, 'key', key);

  if (deleted) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `element ${key} removed`,
    };
    res.status(200).send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `element ${key} do not exist`,
    };
    res.status(404).send(jsonResult);
  }
}

async function deleteAllEntries(req, res) {
  const {
    mapName,
  } = req.params;

  const collectionName = (`${mapName}_map`).toLowerCase();
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
      result: `there is no elements in map ${mapName}`,
    };
    res.status(404).send(jsonResult);
  }
}

async function deleteMap(req, res) {
  const {
    mapName,
  } = req.params;

  const collectionName = (`${mapName}_map`).toLowerCase();
  const result = await db.dropCollection(collectionName);

  if (result) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `map ${mapName} deleted`,
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

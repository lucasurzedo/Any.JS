const mongoose = require('mongoose');
const fs = require('fs');
const ModelObject = require('../models/object');
const db = require('../db');
const utils = require('../utils/index');
const instantiateObj = require('../services/instantiateObj');

async function storeObject(req, res) {
  const {
    objectName,
    code,
    object,
  } = req.body;

  if (!objectName || !code || !object) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);
    return;
  }

  const collectionName = (`${code}_object`).toLowerCase();

  const document = await db.getDocument(collectionName, 'objectName', objectName);

  if (document) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'duplicate file',
    };
    res.status(409).send(jsonError);
  } else {
    const Object = mongoose.model(collectionName, ModelObject, collectionName);

    const newObject = new Object({
      className: code,
      objectName,
      object,
    });

    newObject.save();

    const jsonResult = {
      result: `${req.baseUrl}${req.url}/${code}/${objectName}`,
    };
    res.status(201).send(jsonResult);
  }
}

async function updateStoredObject(req, res) {
  const {
    objectName,
    code,
    object,
  } = req.body;

  if (!objectName || !code || !object) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);
    return;
  }

  const collectionName = (`${code}_object`).toLowerCase();

  const documentObject = await db.getDocument(collectionName, 'objectName', objectName);

  if (documentObject) {
    await db.deleteDocument(collectionName, 'objectName', objectName);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no object ${objectName}`,
    };
    res.status(404).send(jsonError);
    return;
  }

  const Object = mongoose.model(collectionName, ModelObject, collectionName);

  const newObject = new Object({
    className: code,
    objectName,
    object,
  });

  newObject.save();

  const jsonResult = {
    result: `${req.baseUrl}${req.url}/${code}/${objectName}`,
  };
  res.status(201).send(jsonResult);
}

async function instantiateObject(req, res) {
  const {
    objectName,
    code,
    mainClassPath,
    args,
  } = req.body;

  const {
    language,
  } = req.params;

  if (!objectName || !code || !args || !language) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);
    return;
  }

  const collectionName = (`${code}_object`).toLowerCase();

  const documentObject = await db.getDocument(collectionName, 'objectName', objectName);

  if (documentObject) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}/${code}/${objectName}`,
      result: `object ${objectName} already exist`,
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
  const classesLinks = [];

  // Separate names and links in a object
  for (let i = 0; i < codes.length; i += 1) {
    for (const key in codes[i]) {
      classesLinks.push({ name: key, link: codes[i][key] });
    }
  }

  const DIRECTORY = {
    javascript: `./src/codesJs/${code}/`,
    java: `./src/codesJava/${code}/`,
    python: `./src/codesPy/${code}/`,
  };

  const FILETYPE = {
    javascript: '.js',
    java: '.jar',
    python: '.py',
  };

  // Verify if the file already exists
  for (let i = 0; i < classesLinks.length; i += 1) {
    const path = `${DIRECTORY[language]}${classesLinks[i].name}${FILETYPE[language]}`;

    if (fs.existsSync(path)) {
      classesLinks.splice(i, 1);
      i -= 1;
    }
  }

  const Object = mongoose.model(collectionName, ModelObject, collectionName);

  const newObject = new Object({
    className: code,
    objectName,
    object: null,
  });

  await newObject.save();
  const jsonResult = {
    uri: `${req.baseUrl}${req.url}/${code}/${objectName}`,
    result: 'instantiating object',
  };
  res.status(201).send(jsonResult);

  // If the file don't exists then its downloaded and executed
  // If the file exists then its executed
  if (classesLinks.length > 0) {
    const downloadedCode = await utils.downloadCode(classesLinks, language, code);
    if (downloadedCode) {
      instantiateObj({
        code, mainClassPath, args, language,
      }).then((result) => {
        newObject.object = result;
        newObject.save();
      });
    } else {
      const jsonError = {
        uri: `${req.baseUrl}${req.url}/${code}/${objectName}`.toLowerCase(),
        result: 'error downloading the codes',
      };
      res.status(400).send(jsonError);
    }
  } else {
    instantiateObj({
      code, mainClassPath, args, language,
    }).then((result) => {
      newObject.object = result;
      newObject.save();
    });
  }
}

async function updateInstantiatedObject(req, res) {
  const {
    objectName,
    code,
    mainClassPath,
    args,
  } = req.body;

  const {
    language,
  } = req.params;

  if (!objectName || !code || !args || !language) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);
    return;
  }

  const collectionName = (`${code}_object`).toLowerCase();

  const documentObject = await db.getDocument(collectionName, 'objectName', objectName);

  if (documentObject) {
    await db.deleteDocument(collectionName, 'objectName', objectName);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no object ${objectName}`,
    };
    res.status(404).send(jsonError);
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
  const classesLinks = [];

  // Separate names and links in a object
  for (let i = 0; i < codes.length; i += 1) {
    for (const key in codes[i]) {
      classesLinks.push({ name: key, link: codes[i][key] });
    }
  }

  const DIRECTORY = {
    javascript: `./src/codesJs/${code}/`,
    java: `./src/codesJava/${code}/`,
    python: `./src/codesPy/${code}/`,
  };

  const FILETYPE = {
    javascript: '.js',
    java: '.jar',
    python: '.py',
  };

  // Verify if the file already exists
  for (let i = 0; i < classesLinks.length; i += 1) {
    const path = `${DIRECTORY[language]}${classesLinks[i].name}${FILETYPE[language]}`;

    if (fs.existsSync(path)) {
      classesLinks.splice(i, 1);
      i -= 1;
    }
  }

  const Object = mongoose.model(collectionName, ModelObject, collectionName);

  const newObject = new Object({
    className: code,
    objectName,
    object: null,
  });

  await newObject.save();
  const jsonResult = {
    uri: `${req.baseUrl}${req.url}/${code}/${objectName}`,
    result: 'instantiating object',
  };
  res.status(201).send(jsonResult);

  // If the file don't exists then its downloaded and executed
  // If the file exists then its executed
  if (classesLinks.length > 0) {
    const downloadedCode = await utils.downloadCode(classesLinks, language, code);
    if (downloadedCode) {
      instantiateObj({
        code, mainClassPath, args, language,
      }).then((result) => {
        newObject.object = result;
        newObject.save();
      });
    } else {
      const jsonError = {
        uri: `${req.baseUrl}${req.url}/${code}/${objectName}`.toLowerCase(),
        result: 'error downloading the codes',
      };
      res.status(400).send(jsonError);
    }
  } else {
    instantiateObj({
      code, mainClassPath, args, language,
    }).then((result) => {
      newObject.object = result;
      newObject.save();
    });
  }
}

async function getAllObjects(req, res) {
  const {
    codeName,
  } = req.params;

  const {
    skip,
    limit,
  } = req.query;

  const collectionName = (`${codeName}_object`).toLowerCase();

  const documents = await db.getAllDocuments(collectionName, skip, limit);

  const elements = [];
  for (const iterator of documents) {
    elements.push(iterator);
  }

  if (elements.length === 0) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no elements in object ${codeName}`,
    };
    res.status(404).send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      elements,
    };
    res.status(200).send(jsonResult);
  }
}

async function getObject(req, res) {
  const {
    codeName,
    objectName,
  } = req.params;

  const collectionName = (`${codeName}_object`).toLowerCase();

  const document = await db.getDocument(collectionName, 'objectName', objectName);

  if (document) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: document,
    };

    res.status(200).send(jsonResult);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no object ${objectName}`,
    };
    res.status(404).send(jsonError);
  }
}

async function deleteAllObjects(req, res) {
  const {
    codeName,
  } = req.params;

  const collectionName = (`${codeName}_object`).toLowerCase();

  const deleted = await db.deleteAllDocuments(collectionName);

  if (deleted) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'all objects deleted',
    };
    res.status(200).send(jsonResult);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no objects in ${codeName}`,
    };
    res.status(404).send(jsonError);
  }
}

async function deleteObject(req, res) {
  const {
    codeName,
    objectName,
  } = req.params;

  const collectionName = (`${codeName}_object`).toLowerCase();

  const deleted = await db.deleteDocument(collectionName, 'objectName', objectName);

  if (deleted) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `object ${objectName} removed`,
    };
    res.status(200).send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `object ${objectName} do not exist`,
    };
    res.status(404).send(jsonResult);
  }
}

module.exports = {
  storeObject,
  updateStoredObject,
  instantiateObject,
  updateInstantiatedObject,
  getAllObjects,
  getObject,
  deleteAllObjects,
  deleteObject,
};

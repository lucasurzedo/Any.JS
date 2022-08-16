const mongoose = require('mongoose');
const fs = require('fs');
const BSON = require('bson');
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
      objectName: objectName,
      object: object,
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
  }

  const Object = mongoose.model(collectionName, ModelObject, collectionName);

  const newObject = new Object({
    className: code,
    objectName: objectName,
    object: object,
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
    args,
  } = req.body;

  if (!objectName || !code || !args) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);
    return;
  }

  const registerCollection = 'registers';

  // Try to find the code in collection registers
  const documentCode = await db.getDocument(registerCollection, 'codeName', code);

  if (!documentCode) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no code ${code}`,
    };
    res.status(404).send(jsonError);
    return;
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

  const Object = mongoose.model(collectionName, ModelObject, collectionName);

  const newObject = new Object({
    className: code,
    objectName: objectName,
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
  if (methodsLinks.length > 0) {
    const code = await utils.downloadCode(methodsLinks);
    if (code) {
      instantiateObj(req.body).then((result) => {
        console.log(result);
        if (result.error) {
          newObject.object = result;
          newObject.save();
        } else {
          newObject.object = BSON.serialize(result, { serializeFunctions: true });
          newObject.save();
        }
      });
    } else {
      const jsonResult = {
        uri: `${req.baseUrl}${req.url}/${code}/${objectName}`.toLowerCase(),
        result: 'error downloading the codes',
      };
      res.status(400).send(jsonResult);
    }
  } else {
    instantiateObj(req.body).then((result) => {
      console.log(result);
      if (result.error) {
        newObject.object = result;
        newObject.save();
      } else {
        newObject.object = BSON.serialize(result, { serializeFunctions: true });
        newObject.save();
      }
    });
  }
}

async function updateInstantiatedObject(req, res) {
  const {
    objectName,
    code,
    args,
  } = req.body;

  if (!objectName || !code || !args) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);
    return;
  }

  const registerCollection = 'registers';

  // Try to find the code in collection registers
  const documentCode = await db.getDocument(registerCollection, 'codeName', code);

  if (!documentCode) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no code ${code}`,
    };
    res.status(404).send(jsonError);
    return;
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

  const collectionName = (`${code}_object`).toLowerCase();

  const documentObject = await db.getDocument(collectionName, 'objectName', objectName);

  if (documentObject) {
    await db.deleteDocument(collectionName, 'objectName', objectName);
  }

  const Object = mongoose.model(collectionName, ModelObject, collectionName);

  const newObject = new Object({
    className: code,
    objectName: objectName,
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
  if (methodsLinks.length > 0) {
    const code = await utils.downloadCode(methodsLinks);
    if (code) {
      instantiateObj(req.body).then((result) => {
        console.log(result);
        if (result.error) {
          newObject.object = result;
          newObject.save();
        } else {
          newObject.object = BSON.serialize(result, { serializeFunctions: true });
          newObject.save();
        }
      });
    } else {
      const jsonResult = {
        uri: `${req.baseUrl}${req.url}/${code}/${objectName}`.toLowerCase(),
        result: 'error downloading the codes',
      };
      res.status(400).send(jsonResult);
    }
  } else {
    instantiateObj(req.body).then((result) => {
      console.log(result);
      if (result.error) {
        newObject.object = result;
        newObject.save();
      } else {
        newObject.object = BSON.serialize(result, { serializeFunctions: true });
        newObject.save();
      }
    });
  }
}

async function getAllObjects(req, res) {
  const {
    codeName,
  } = req.params;

  const collectionName = (`${codeName}_object`).toLowerCase();

  const documents = await db.getAllDocuments(collectionName);

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

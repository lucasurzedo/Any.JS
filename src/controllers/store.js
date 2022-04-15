const mongoose = require('mongoose');
const fs = require('fs');
const BSON = require('bson');
const ModelObject = require('../models/object');
const db = require('../db');
const utils = require('../utils/index');
const instantiateObj = require('../services/instantiateObj');

async function storeObject(req, res) {
  if (!req.body.objectName || !req.body.code || !req.body.object) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
      status: 400,
    };

    res.send(jsonError);
    return;
  }

  const collectionName = (`${req.body.code}_object`).toLowerCase();

  const document = await db.getDocument(collectionName, 'objectName', req.body.objectName);

  if (document) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'duplicate file',
      status: 409,
    };
    res.send(jsonError);
  } else {
    const Object = mongoose.model(collectionName, ModelObject, collectionName);

    const newObject = new Object({
      className: req.body.code,
      objectName: req.body.objectName,
      object: req.body.object,
    });

    newObject.save();

    const jsonResult = {
      result: `${req.baseUrl}${req.url}/${req.body.objectName}`,
      status: 201,
    };
    res.send(jsonResult);
  }
}

async function instantiateObject(req, res) {
  if (!req.body.objectName || !req.body.code || !req.body.args) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}/${req.body.objectName}`,
      result: 'invalid JSON',
      status: 400,
    };

    res.send(jsonError);
    return;
  }

  const collectionName = (`${req.body.code}_object`).toLowerCase();
  const registerCollection = 'registers';

  // Try to find the code in collection registers
  const documentCode = await db.getDocument(registerCollection, 'codeName', req.body.code);

  if (!documentCode) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no code ${req.params.codeName}`,
      status: 404,
    };
    res.send(jsonError);
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

  const documentObject = await db.getDocument(registerCollection, 'objectName', req.body.objectName);

  if (documentObject) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}${req.body.objectName}`,
      result: `object ${req.body.objectName} already exist`,
      status: 409,
    };
    res.send(jsonResult);
  }

  const Object = mongoose.model(collectionName, ModelObject, collectionName);

  const newObject = new Object({
    className: req.body.code,
    objectName: req.body.objectName,
    object: null,
  });

  await newObject.save();

  // If the file don't exists then its downloaded and executed
  // If the file exists then its executed
  if (methodsLinks.length > 0) {
    const code = await utils.downloadCode(methodsLinks);
    if (code) {
      const jsonResult = {
        uri: `${req.baseUrl}${req.url}${req.body.objectName}`,
        result: 'instantiating object',
        status: 201,
      };
      res.send(jsonResult);

      instantiateObj(req.body).then((result) => {
        console.log(result);
        if (result === 'error during instantiate process') {
          newObject.object = result;
          newObject.save();
        } else {
          newObject.object = BSON.serialize(result, { serializeFunctions: true });
          newObject.save();
        }
      });
    }
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}/${req.body.objectName}`,
      result: 'instantiating object',
      status: 201,
    };
    res.send(jsonResult);

    instantiateObj(req.body).then((result) => {
      console.log(result);
      if (result === 'error during instantiate process') {
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
  const collectionName = (`${req.params.codeName}_object`).toLowerCase();

  const documents = await db.getAllDocuments(collectionName);

  const elements = [];
  for (const iterator of documents) {
    elements.push(iterator);
  }

  if (elements.length === 0) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no elements in object ${req.params.codeName}`,
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

async function getObject(req, res) {
  const collectionName = (`${req.params.codeName}_object`).toLowerCase();

  const document = await db.getDocument(collectionName, 'objectName', req.params.objectName);

  if (document) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: document,
      status: 200,
    };

    res.send(jsonResult);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no object ${req.params.objectName}`,
      status: 404,
    };
    res.send(jsonError);
  }
}

async function deleteObject(req, res) {
  const collectionName = (`${req.params.codeName}_object`).toLowerCase();

  const deleted = await db.deleteDocument(collectionName, 'objectName', req.params.objectName);

  if (deleted) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `object ${req.params.objectName} removed`,
      status: 200,
    };
    res.send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `object ${req.params.objectName} do not exist`,
      status: 404,
    };
    res.send(jsonResult);
  }
}

module.exports = {
  storeObject,
  instantiateObject,
  getAllObjects,
  getObject,
  deleteObject,
};

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

  const document = await db.getDocument(collectionName, 'objectName', req.params.key);

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
  const jsonError = {
    uri: `${req.baseUrl}${req.url}/${req.body.objectName}`,
    Error: 'Invalid JSON',
    status: 400,
  };

  if (!req.body.objectName || !req.body.code || !req.body.args) {
    res.send(jsonError);
    return;
  }

  let codeName = `${req.body.code}`;
  codeName = codeName.toLowerCase();
  req.body.code = codeName;

  // Open collection registers on db
  mongoose.connection.db.collection('registers', (error, collection) => {
    if (error) {
      jsonError.Error = error;
      res.send(jsonError);
      return;
    }
    // Try to find a code in collection registers
    collection.findOne({ codeName }, async (err, data) => {
      if (err) {
        jsonError.Error = err;
        res.send(jsonError);
        return;
      }
      // Verify if the code exists
      if (!data) {
        const jsonErr = {
          uri: `${req.baseUrl}${req.url}`,
          result: `cannot find code ${codeName}`,
          status: 406,
        };
        res.send(jsonErr);
      } else {
        const codes = [];
        const methodsLinks = [];
        // Get all the codes names and links
        for (const iterator of data.code) {
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

        const collectionName = `${req.body.code}_object`;

        const objectCollection = mongoose.connection.db.collection(collectionName);

        const objName = req.body.objectName;
        const findObjectName = await objectCollection.findOne({ objectName: objName });

        if (findObjectName != null) {
          const jsonResult = {
            uri: `${req.baseUrl}${req.url}${req.body.objectName}`,
            result: `Object ${req.body.objectName} already exist`,
            status: 409,
          };
          res.send(jsonResult);
        } else {
          const Object = mongoose.model(collectionName, ModelObject, collectionName);

          const newTask = new Object({
            className: req.body.code,
            objectName: req.body.objectName,
            object: null,
          });

          await newTask.save();

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
                  newTask.object = result;
                  newTask.save();
                } else {
                  newTask.object = BSON.serialize(result, { serializeFunctions: true });
                  newTask.save();
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
                newTask.object = result;
                newTask.save();
              } else {
                newTask.object = BSON.serialize(result, { serializeFunctions: true });
                newTask.save();
              }
            });
          }
        }
      }
    });
  });
}

async function getAllObjects(req, res) {
  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
    objects: null,
  };

  mongoose.connection.db.collection('collectionName', (err, collection) => {
    if (err) {
      console.log(err);
      return;
    }

    collection.find({}).toArray((error, documents) => {
      if (error) {
        console.log(error);
        return;
      }

      const objects = [];

      for (const iterator of documents) {
        objects.push(iterator);
      }

      if (objects.length === 0) {
        jsonResult.result = 'there is no objects in collection objects';
        jsonResult.status = 404;
        res.send(jsonResult);
      } else {
        jsonResult.objects = objects;
        jsonResult.status = 200;
        res.send(jsonResult);
      }
    });
  });
}

async function getObject(req, res) {
  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
    object: null,
  };
  const collectionName = `${req.params.codeName}_object`;

  mongoose.connection.db.collection(collectionName, (err, collection) => {
    if (err) {
      console.log(err);
      return;
    }

    collection.find({}).toArray((error, documents) => {
      if (error) {
        console.log(error);
        return;
      }

      for (const iterator of documents) {
        if (iterator.objectName === req.params.objectName) {
          jsonResult.object = iterator;
        }
      }
      if (jsonResult.object === null) {
        delete jsonResult.object;
        jsonResult.result = `there is no object ${req.params.objectName}`;
        jsonResult.status = 404;
        res.send(jsonResult);
      } else {
        jsonResult.status = 200;
        res.send(jsonResult);
      }
    });
  });
}

async function deleteObject(req, res) {
  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
  };
  const collectionName = 'objects';

  mongoose.connection.db.collection(collectionName, (err, collection) => {
    if (err) {
      console.log(err);
      return;
    }

    collection.deleteOne({ objectName: req.params.objectName }, (error, result) => {
      if (error) {
        console.log(error);
      } else if (result.deletedCount > 0) {
        jsonResult.result = `object ${req.params.objectName} deleted`;
        jsonResult.status = 200;
        res.send(jsonResult);
      } else {
        jsonResult.result = `object ${req.params.objectName} do not exist`;
        jsonResult.status = 404;
        res.send(jsonResult);
      }
    });
  });
}

module.exports = {
  storeObject,
  instantiateObject,
  getAllObjects,
  getObject,
  deleteObject,
};

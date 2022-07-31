const mongoose = require('mongoose');
const ModelObject = require('../models/object');
const ModelMap = require('../models/map');
const db = require('../db');

async function lockObject(req, res) {
  const {
    objectName,
    identifier
  } = req.body;

  if (!objectName || !identifier) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);
    return;
  }

  const collectionName = (`${objectName}_object`).toLowerCase();

  const collectionExists = await db.hasCollection(collectionName);

  const lockMetadata = await db.getDocument(collectionName, 'type', 'lockMetadata');
  const lockQueue = Array.from(lockMetadata.lockQueue);

  if (collectionExists && lockMetadata) {
    if (lockMetadata.locked === '') {
      const newValues = {
        $set: { locked: identifier },
        $currentDate: { lastModified: true },
      };

      const query = {};
      query._id = lockMetadata._id;

      await db.updateDocument(collectionName, query, newValues);

      const jsonResult = {
        uri: `${req.baseUrl}${req.url}/${objectName}`,
        result: `object locked to id: ${identifier}`,
      };

      res.status(200).send(jsonResult);
    } else if (lockMetadata.locked === identifier || lockQueue.includes(identifier)) {
      const jsonResult = {
        uri: `${req.baseUrl}${req.url}`,
        result: `id ${identifier} already on lock state or lock queue`,
      };

      res.status(409).send(jsonResult);
    } else {
      lockQueue.push(identifier);

      const newValues = {
        $set: { lockQueue: lockQueue },
        $currentDate: { lastModified: true },
      };

      const query = {};
      query._id = lockMetadata._id;

      await db.updateDocument(collectionName, query, newValues);

      const jsonResult = {
        uri: `${req.baseUrl}${req.url}/${objectName}`,
        result: `id ${identifier} added to lock queue`,
      };

      res.status(200).send(jsonResult);
    }
  } else if (collectionExists) {
    const Object = mongoose.model(collectionName, ModelObject, collectionName);

    const newObject = new Object({
      type: 'lockMetadata',
      locked: identifier,
      lockQueue: [],
    });

    newObject.save();

    const jsonResult = {
      uri: `${req.baseUrl}${req.url}/${objectName}`,
      result: `object locked to id: ${identifier}`,
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

async function lockMap(req, res) {

}

async function unlockObject(req, res) {

}

async function unlockMap(req, res) {

}

async function getLockedObject(req, res) {

}

async function getLockerMap(req, res) {

}

async function deleteObjectLock(req, res) {

}

async function deleteMapLock(req, res) {

}

module.exports = {
  lockObject,
  lockMap,
  unlockObject,
  unlockMap,
  getLockedObject,
  getLockerMap,
  deleteObjectLock,
  deleteMapLock,
};

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

  if (collectionExists && lockMetadata) {
    const lockQueue = Array.from(lockMetadata.lockQueue);

    if (lockMetadata.locked === '') {
      const newValues = {
        $set: { locked: identifier },
        $currentDate: { lastModified: true },
      };

      const query = {
        _id: lockMetadata._id,
      };

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

      const query = {
        _id: lockMetadata._id,
      };

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
  const {
    mapName,
    key,
    identifier
  } = req.body;

  if (!mapName || !identifier) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);
    return;
  }

  const collectionName = (`${mapName}_map`).toLowerCase();

  const collectionExists = await db.hasCollection(collectionName);

  const lockMetadata = await db.getDocument(collectionName, 'type', 'lockMetadata');

  if (collectionExists && lockMetadata.lockedKeys[key]) {
    const lockQueue = Array.from(lockMetadata.lockedKeys[key].lockQueue);

    if (lockMetadata.lockedKeys[key].locked === '') {
      let lockedKeys = lockMetadata.lockedKeys;
      lockedKeys[key].locked = identifier;
      const newValues = {
        $set: { lockedKeys: lockedKeys },
        $currentDate: { lastModified: true },
      };

      const query = {
        _id: lockMetadata._id,
      };

      await db.updateDocument(collectionName, query, newValues);

      const jsonResult = {
        uri: `${req.baseUrl}${req.url}/${mapName}/key/${key}`,
        result: `map entry ${key} locked to id: ${identifier}`,
      };

      res.status(200).send(jsonResult);
    } else if (lockMetadata.lockedKeys[key].locked === identifier || lockQueue.includes(identifier)) {
      const jsonResult = {
        uri: `${req.baseUrl}${req.url}`,
        result: `id ${identifier} already on lock state or lock queue`,
      };

      res.status(409).send(jsonResult);
    } else {
      let lockedKeys = lockMetadata.lockedKeys;
      lockQueue.push(identifier);
      lockedKeys[key].lockQueue = lockQueue;

      const newValues = {
        $set: { lockedKeys: lockedKeys },
        $currentDate: { lastModified: true },
      };

      const query = {
        _id: lockMetadata._id,
      };

      await db.updateDocument(collectionName, query, newValues);

      const jsonResult = {
        uri: `${req.baseUrl}${req.url}/${mapName}/key/${key}`,
        result: `id ${identifier} added to lock queue`,
      };

      res.status(200).send(jsonResult);
    }
  } else if (collectionExists) {
    const Map = mongoose.model(collectionName, ModelMap, collectionName);

    if (!lockMetadata) {
      let lockedKeys = {}

      lockedKeys[key] = {
        locked: identifier,
        lockQueue: [],
      }

      const newMap = new Map({
        type: 'lockMetadata',
        lockedKeys,
      });

      newMap.save();

      const jsonResult = {
        uri: `${req.baseUrl}${req.url}/${mapName}`,
        result: `map entry ${key} locked to id: ${identifier}`,
      };

      res.status(200).send(jsonResult);
    } else {
      let lockedKeys = lockMetadata.lockedKeys;
      lockedKeys[key] = {
        locked: identifier,
        lockQueue: [],
      }

      const newValues = {
        $set: { lockedKeys: lockedKeys },
        $currentDate: { lastModified: true },
      };

      const query = {
        _id: lockMetadata._id,
      };

      await db.updateDocument(collectionName, query, newValues);

      const jsonResult = {
        uri: `${req.baseUrl}${req.url}/${mapName}`,
        result: `map entry ${key} locked to id: ${identifier}`,
      };

      res.status(200).send(jsonResult);
    }
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url} `,
      result: `map ${mapName} do not exist`,
    };

    res.status(404).send(jsonResult);
  }
}

async function unlockObject(req, res) {
  const {
    objectName,
    identifier
  } = req.body;

  if (!objectName || !identifier) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url} `,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);
    return;
  }

  const collectionName = (`${objectName} _object`).toLowerCase();

  const collectionExists = await db.hasCollection(collectionName);

  const lockMetadata = await db.getDocument(collectionName, 'type', 'lockMetadata');
  const lockQueue = Array.from(lockMetadata.lockQueue);

  if (collectionExists && lockMetadata) {
    if (lockMetadata.locked == identifier) {
      const newLocked = lockQueue.shift();
      let newValues = {};

      if (newLocked) {
        newValues = {
          $set: { locked: newLocked, lockQueue: lockQueue },
          $currentDate: { lastModified: true },
        };
      } else {
        newValues = {
          $set: { locked: '', lockQueue: lockQueue },
          $currentDate: { lastModified: true },
        };
      }

      const query = {
        _id: lockMetadata._id,
      };

      await db.updateDocument(collectionName, query, newValues);

      const jsonResult = {
        uri: `${req.baseUrl}${req.url} /${objectName}`,
        result: `object ${objectName} unlocked from id: ${identifier}`,
      };

      res.status(200).send(jsonResult);
    } else {
      const jsonResult = {
        uri: `${req.baseUrl}${req.url}`,
        result: `object not locked to id: ${identifier}`,
      };

      res.status(403).send(jsonResult);
    }
  } else if (!lockMetadata) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}/${mapName}`,
      result: `object ${objectName} has not been locked yet`,
    };

    res.status(404).send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `object ${objectName} do not exist`,
    };

    res.status(404).send(jsonResult);
  }
}

async function unlockMap(req, res) {

}

async function getLockedObject(req, res) {
  const objectName = req.params.objName;

  const collectionName = (`${objectName}_object`).toLowerCase();

  const collectionExists = await db.hasCollection(collectionName);

  if (collectionExists) {
    const lockMetadata = await db.getDocument(collectionName, 'type', 'lockMetadata');

    if (lockMetadata) {
      const jsonResult = {
        uri: `${req.baseUrl}${req.url}/${objectName}`,
        result: lockMetadata,
      };

      res.status(200).send(jsonResult);
    } else {
      const jsonResult = {
        uri: `${req.baseUrl}${req.url}/${mapName}`,
        result: `object ${objectName} has not been locked yet`,
      };

      res.status(404).send(jsonResult);
    }
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `object ${objectName} do not exist`,
    };

    res.status(404).send(jsonResult);
  }
}

async function getLockedMap(req, res) {
  const mapName = req.params.mapName;
  const key = req.params.key;

  const collectionName = (`${mapName}_map`).toLowerCase();

  const collectionExists = await db.hasCollection(collectionName);

  if (collectionExists) {
    const lockMetadata = await db.getDocument(collectionName, 'type', 'lockMetadata');

    if (lockMetadata && lockMetadata.lockedKeys[key]) {
      const jsonResult = {
        uri: `${req.baseUrl}${req.url}/${mapName}`,
        result: lockMetadata.lockedKeys[key],
      };

      res.status(200).send(jsonResult);
    } else {
      const jsonResult = {
        uri: `${req.baseUrl}${req.url}/${mapName}`,
        result: `entry ${key} of map ${mapName} has not been locked yet`,
      };

      res.status(404).send(jsonResult);
    }
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `map ${mapName} do not exist`,
    };

    res.status(404).send(jsonResult);
  }
}

async function deleteObjectLock(req, res) {
  const objectName = req.params.objName;
  const identifier = req.params.identifier;

  const collectionName = (`${objectName}_object`).toLowerCase();

  const collectionExists = await db.hasCollection(collectionName);
  const lockMetadata = await db.getDocument(collectionName, 'type', 'lockMetadata');

  if (collectionExists && lockMetadata) {
    const lockQueue = Array.from(lockMetadata.lockQueue).filter(data => data !== identifier);

    const newValues = {
      $set: { lockQueue: lockQueue },
      $currentDate: { lastModified: true },
    };

    const query = {
      _id: lockMetadata._id,
    };

    await db.updateDocument(collectionName, query, newValues);

    const jsonResult = {
      uri: `${req.baseUrl}${req.url}/${objectName}`,
      result: `id ${identifier} deleted from queue of locks of object ${objectName}`,
    };

    res.status(200).send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `object ${objectName} do not exist or has not been locked yet`,
    };

    res.status(404).send(jsonResult);
  }
}

async function deleteMapLock(req, res) {
  const mapName = req.params.mapName;
  const key = req.params.key;
  const identifier = req.params.identifier;

  const collectionName = (`${mapName}_map`).toLowerCase();

  const collectionExists = await db.hasCollection(collectionName);
  const lockMetadata = await db.getDocument(collectionName, 'type', 'lockMetadata');

  if (collectionExists && lockMetadata) {
    const lockQueue = Array.from(lockMetadata.lockedKeys[key].lockQueue).filter(data => data !== identifier);

    let lockedKeys = lockMetadata.lockedKeys;
    lockedKeys[key].lockQueue = lockQueue;

    const newValues = {
      $set: { lockedKeys: lockedKeys },
      $currentDate: { lastModified: true },
    };

    const query = {
      _id: lockMetadata._id,
    };

    await db.updateDocument(collectionName, query, newValues);

    const jsonResult = {
      uri: `${req.baseUrl}${req.url}/${mapName}`,
      result: `id ${identifier} deleted from queue of locks of map: ${mapName} entry: ${key}`,
    };

    res.status(200).send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `map ${mapName} do not exist or has not been locked yet`,
    };

    res.status(404).send(jsonResult);
  }
}

module.exports = {
  lockObject,
  lockMap,
  unlockObject,
  unlockMap,
  getLockedObject,
  getLockedMap,
  deleteObjectLock,
  deleteMapLock,
};

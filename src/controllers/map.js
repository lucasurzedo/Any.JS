const mongoose = require('mongoose');
const ModelMap = require('../models/map');

function setElement(req, res) {
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

  const collectionName = `${req.body.mapName}_map`;

  mongoose.connection.db.collection(collectionName, (error, collection) => {
    if (error) {
      console.log(error);
    }

    collection.findOne({ mapName: req.body.mapName }, async (err, data) => {
      if (err) {
        console.log(err);
      }

      if (data && data.key === req.body.key) {
        const jsonError = {
          uri: `${req.baseUrl}${req.url}`,
          result: 'duplicate file',
          status: 409,
        };
        res.send(jsonError);

        return;
      }
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
    });
  });
}

function getElement(req, res) {
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

  const collectionName = `${req.body.mapName}_map`;

  mongoose.connection.db.collection(collectionName, (error, collection) => {
    if (error) {
      console.log(error);
    }

    collection.findOne({ mapName: req.body.mapName }, async (err, data) => {
      if (err) {
        console.log(err);
      }

      if (data && data.key === req.body.key) {
        const jsonError = {
          uri: `${req.baseUrl}${req.url}`,
          result: 'duplicate file',
          status: 409,
        };
        res.send(jsonError);

        return;
      }
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
    });
  });
}

function clearMap(req, res) {
// TODO
}

function deleteKey(req, res) {
// TODO
}

function getIterator(req, res) {
// TODO
}

function mapForEach(req, res) {
// TODO
}

function hasElement(req, res) {
// TODO
}

function getAllKeys(req, res) {
// TODO
}

function getAllElements(req, res) {
// TODO
}

module.exports = {
  setElement,
  getElement,
  clearMap,
  deleteKey,
  getIterator,
  mapForEach,
  hasElement,
  getAllKeys,
  getAllElements,
};

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

    collection.findOne({ key: req.body.key }, async (err, data) => {
      if (err) {
        console.log(err);
      }

      if (data) {
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
  let mapName = `${req.params.mapName}`;
  mapName = mapName.toLowerCase();
  req.params.mapName = mapName;

  const collectionName = `${req.params.mapName}_map`;

  mongoose.connection.db.collection(collectionName, (error, collection) => {
    if (error) {
      console.log(error);
    }

    collection.findOne({ key: req.params.key }, (err, data) => {
      if (err) {
        console.log(err);
      }

      if (!data) {
        const jsonError = {
          uri: `${req.baseUrl}${req.url}`,
          result: `there is no key ${req.params.key}`,
          status: 404,
        };
        res.send(jsonError);

        return;
      }

      const jsonResult = {
        uri: `${req.baseUrl}${req.url}`,
        result: data.value,
        status: 200,
      };

      res.send(jsonResult);
    });
  });
}

function clearMap(req, res) {
  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
  };

  const collectionName = `${req.params.mapName}_map`;

  mongoose.connection.db.collection(collectionName, async (err, collection) => {
    if (err) {
      console.log(err);
      return;
    }

    const collectionCount = await collection.countDocuments();
    if (collectionCount === 0) {
      const jsonError = {
        uri: `${req.baseUrl}${req.url}`,
        result: `there is no map ${collectionName}`,
        status: 404,
      };
      res.send(jsonError);

      return;
    }

    collection.drop();

    jsonResult.result = `map ${req.params.mapName} deleted`;
    jsonResult.status = 200;

    res.send(jsonResult);
  });
}

function deleteKey(req, res) {
  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
  };

  const collectionName = `${req.params.mapName}_map`;

  mongoose.connection.db.collection(collectionName, (err, collection) => {
    if (err) {
      console.log(err);
      return;
    }

    collection.deleteOne({ executionName: req.params.executionName }, (error, result) => {
      if (error) {
        console.log(error);
      } else if (result.deletedCount > 0) {
        jsonResult.result = `execution ${req.params.executionName} deleted`;
        jsonResult.status = 200;
        res.send(jsonResult);
      } else {
        jsonResult.result = `execution ${req.params.executionName} do not exist`;
        jsonResult.status = 404;
        res.send(jsonResult);
      }
    });
  });
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

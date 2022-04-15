const mongoose = require('mongoose');
const db = require('../db');
const validUrl = require('valid-url');
const ModelRegister = require('../models/register');
const collectionName = 'registers';
 
async function registerCode(req, res) {
  if (!req.body.codeName || !req.body.code) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
      status: 400,
    };

    res.send(jsonError);

    return;
  }

  const codes = [];
  for (const iterator of req.body.code) {
    codes.push(iterator);
  }

  for (let i = 0; i < codes.length; i += 1) {
    for (const key in codes[i]) {
      if (!validUrl.isUri(codes[i][key])) {
        const jsonError = {
          uri: `${req.baseUrl}${req.url}`,
          result: 'invalid url',
          status: 406,
        };
        res.send(jsonError);

        return;
      }
    }
  }

  const document = await db.getDocument(collectionName, 'codeName', req.body.codeName);

  if (document) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'duplicate code',
      status: 409,
    };
    res.send(jsonError);
  } else {
    const Code = mongoose.model(collectionName, ModelRegister, collectionName);

    const newCode = new Code({
      codeName: req.body.codeName,
      language: req.body.language,
      code: req.body.code,
    });

    newCode.save();

    const jsonResult = {
      result: `${req.baseUrl}${req.url}/${req.body.mapName}`,
      status: 201,
    };
    res.send(jsonResult);
  }
}

async function updateCode(req, res) {
  const collectionName = 'registers';

  const newValues = {
    $set: { code: req.body.code, value: req.body.value },
    $currentDate: { lastModified: true },
  };
}

async function updateCodeElement(req, res) {
  const collectionName = 'registers';
}

async function getCode(req, res) {
  const collectionName = 'registers';

  mongoose.connection.db.collection(collectionName, (error, collection) => {
    if (error) {
      console.log(error);
      return;
    }

    collection.findOne({ codeName: req.params.codeName }, async (err, data) => {
      if (err) {
        console.log(err);
      }
      if (!data) {
        const jsonError = {
          uri: `${req.baseUrl}${req.url}`,
          result: `cannot find code ${req.params.codeName}`,
          status: 406,
        };
        res.send(jsonError);
      } else {
        const jsonResult = {
          uri: `${req.baseUrl}${req.url}`,
          object: data,
          status: 200,
        };
        res.send(jsonResult);
      }
    });
  });
}

async function deleteCode(req, res) {
  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
  };

  mongoose.connection.db.collection('registers', (err, collection) => {
    if (err) {
      console.log(err);
      return;
    }

    collection.deleteOne({ codeName: req.params.codeName }, (error, result) => {
      if (error) {
        console.log(error);
      } else if (result.deletedCount > 0) {
        jsonResult.result = `execution ${req.params.codeName} deleted`;
        jsonResult.status = 200;
        res.send(jsonResult);
      } else {
        jsonResult.result = `execution ${req.params.codeName} do not exist`;
        jsonResult.status = 404;
        res.send(jsonResult);
      }
    });
  });
}

module.exports = {
  registerCode,
  updateCode,
  updateCodeElement,
  getCode,
  deleteCode,
};

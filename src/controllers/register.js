const mongoose = require('mongoose');
const validUrl = require('valid-url');
const db = require('../db');
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

async function updateCodeElement(req, res) {
  if (!req.body.codeKey || !req.body.codeValue) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
      status: 400,
    };

    res.send(jsonError);

    return;
  }

  const document = await db.getDocument(collectionName, 'codeName', req.params.codeName);

  let changed = false;
  for (const iterator of document.code) {
    if (iterator[req.body.codeKey]) {
      iterator[req.body.codeKey] = req.body.codeValue;
      changed = true;
    }
  }

  if (!changed) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no codeKey ${req.body.codeKey}`,
      status: 404,
    };

    res.send(jsonError);

    return;
  }

  const newValues = {
    $set: { code: document.code },
    $currentDate: { lastModified: true },
  };

  const query = {};
  query.codeName = req.params.codeName;

  const updated = await db.updateDocument(collectionName, query, newValues);

  if (updated.modifiedCount > 0) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      status: 200,
    };

    res.send(jsonResult);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no code ${req.body.key}`,
      status: 404,
    };

    res.send(jsonError);
  }
}

async function updateCode(req, res) {
  if (!req.body.code) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
      status: 400,
    };

    res.send(jsonError);

    return;
  }

  const newValues = {
    $set: { code: req.body.code },
    $currentDate: { lastModified: true },
  };

  const query = {};
  query.codeName = req.params.codeName;

  const updated = await db.updateDocument(collectionName, query, newValues);

  if (updated.modifiedCount > 0) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      status: 200,
    };

    res.send(jsonResult);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no code ${req.body.key}`,
      status: 404,
    };

    res.send(jsonError);
  }
}

async function getCode(req, res) {
  const document = await db.getDocument(collectionName, 'codeName', req.params.codeName);

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
      result: `there is no code ${req.params.codeName}`,
      status: 404,
    };
    res.send(jsonError);
  }
}

async function deleteCode(req, res) {
  const deleted = await db.deleteDocument(collectionName, 'codeName', req.params.codeName);

  if (deleted) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `code ${req.params.codeName} removed`,
      status: 200,
    };
    res.send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `code ${req.params.codeName} do not exist`,
      status: 404,
    };
    res.send(jsonResult);
  }
}

module.exports = {
  registerCode,
  updateCode,
  updateCodeElement,
  getCode,
  deleteCode,
};

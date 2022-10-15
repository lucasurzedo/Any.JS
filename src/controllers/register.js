const mongoose = require('mongoose');
const validUrl = require('valid-url');
const db = require('../db');
const ModelRegister = require('../models/register');

const collectionName = 'registers';

async function registerCode(req, res) {
  const {
    codeName,
    code,
  } = req.body;

  if (!codeName || !code) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);

    return;
  }

  const codes = [];
  for (const iterator of code) {
    codes.push(iterator);
  }

  for (let i = 0; i < codes.length; i += 1) {
    for (const key in codes[i]) {
      if (!validUrl.isUri(codes[i][key])) {
        const jsonError = {
          uri: `${req.baseUrl}${req.url}`,
          result: 'invalid url',
        };
        res.status(406).send(jsonError);

        return;
      }
    }
  }

  const document = await db.getDocument(collectionName, 'codeName', codeName);

  if (document) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'duplicate code',
    };
    res.status(409).send(jsonError);
  } else {
    const Code = mongoose.model(collectionName, ModelRegister, collectionName);

    const newCode = new Code({
      codeName,
      code,
    });

    newCode.save();

    const jsonResult = {
      result: `${req.baseUrl}${req.url}/${codeName}`,
    };
    res.status(201).send(jsonResult);
  }
}

async function updateCodeElement(req, res) {
  const {
    codeKey,
    codeValue,
  } = req.body;

  if (!codeKey || !codeValue) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);

    return;
  }

  const document = await db.getDocument(collectionName, 'codeName', collectionName);

  let changed = false;
  for (const iterator of document.code) {
    if (iterator[codeKey]) {
      iterator[codeKey] = codeValue;
      changed = true;
    }
  }

  if (!changed) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no codeKey ${codeKey}`,
    };

    res.status(404).send(jsonError);

    return;
  }

  const newValues = {
    $set: { code: document.code },
    $currentDate: { lastModified: true },
  };

  const query = {};
  query.codeName = codeKey;

  const updated = await db.updateDocument(collectionName, query, newValues);

  if (updated.modifiedCount > 0) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
    };

    res.status(200).send(jsonResult);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no code ${codeKey}`,
    };

    res.status(404).send(jsonError);
  }
}

async function updateCode(req, res) {
  const {
    code,
  } = req.body;

  const {
    codeName,
  } = req.params;

  if (!code) {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: 'invalid JSON',
    };

    res.status(400).send(jsonError);

    return;
  }

  const newValues = {
    $set: { code },
    $currentDate: { lastModified: true },
  };

  const query = {};
  query.codeName = codeName;

  const updated = await db.updateDocument(collectionName, query, newValues);

  if (updated.modifiedCount > 0) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
    };

    res.status(200).send(jsonResult);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no code ${codeName}`,
    };

    res.status(404).send(jsonError);
  }
}

async function getCode(req, res) {
  const {
    codeName,
  } = req.params;

  const document = await db.getDocument(collectionName, 'codeName', codeName);

  if (document) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: document,
    };

    res.status(200).send(jsonResult);
  } else {
    const jsonError = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no code ${codeName}`,
    };
    res.status(404).send(jsonError);
  }
}

async function deleteCode(req, res) {
  const {
    codeName,
  } = req.params;

  const deleted = await db.deleteDocument(collectionName, 'codeName', codeName);

  if (deleted) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `code ${codeName} removed`,
    };
    res.status(200).send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `code ${codeName} do not exist`,
    };
    res.status(404).send(jsonResult);
  }
}

module.exports = {
  registerCode,
  updateCode,
  updateCodeElement,
  getCode,
  deleteCode,
};

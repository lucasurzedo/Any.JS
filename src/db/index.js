const mongoose = require('mongoose');

async function createCollection(collectionName) {
  try {
    await mongoose.connection.db.createCollection(collectionName);
    return true;
  } catch (error) {
    return false;
  }
}

async function getCollection(collectionName) {
  const collection = mongoose.connection.db.collection(collectionName);

  return collection;
}

async function getDocument(collectionName, key, value) {
  const collection = await getCollection(collectionName);

  const query = {};
  query[key] = value;

  const document = await collection.findOne(query);

  return document;
}

async function getAllDocuments(collectionName, skip, limit) {
  try {
    const collection = await getCollection(collectionName);

    if (!skip) {
      skip = 0;
    }
    if (!limit) {
      limit = 0;
    }

    const documents = collection.find().skip(parseInt(skip, 10)).limit(parseInt(limit, 10));

    return await documents.toArray();
  } catch (error) {
    return [];
  }
}

async function hasCollection(collectionName) {
  const collection = await mongoose.connection.db.listCollections({ name: collectionName }).next();

  return collection !== null;
}

async function updateDocument(collectionName, query, newValues) {
  const collection = await getCollection(collectionName);

  const result = await collection.updateOne(query, newValues);

  return result;
}

async function deleteDocument(collectionName, key, value) {
  const collection = await getCollection(collectionName);

  const query = {};
  query[key] = value;

  const result = await collection.deleteOne(query);

  return result.deletedCount > 0;
}

async function deleteAllDocuments(collectionName) {
  const collection = await getCollection(collectionName);

  const result = await collection.deleteMany({});

  return result.deletedCount > 0;
}

async function dropCollection(collectionName) {
  try {
    const collection = await getCollection(collectionName);
    await collection.drop();

    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  createCollection,
  getCollection,
  getDocument,
  getAllDocuments,
  hasCollection,
  updateDocument,
  deleteDocument,
  deleteAllDocuments,
  dropCollection,
};

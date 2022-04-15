const mongoose = require('mongoose');

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

async function getAllDocuments(collectionName) {
  const collection = await getCollection(collectionName);

  const documents = collection.find({}).toArray();

  return documents;
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

  if (result.deletedCount > 0) return true;

  return false;
}

async function dropCollection(collectionName) {
  const collection = await getCollection(collectionName);

  const collectionCount = await collection.countDocuments();
  if (collectionCount === 0) {
    return false;
  }

  await collection.drop();

  return true;
}

module.exports = {
  getCollection,
  getDocument,
  getAllDocuments,
  updateDocument,
  deleteDocument,
  dropCollection,
};

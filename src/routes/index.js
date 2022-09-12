const express = require('express');

const lockunlock = require('../controllers/lockunlock');
const register = require('../controllers/register');
const store = require('../controllers/store');
const task = require('../controllers/task');
const map = require('../controllers/map');

const router = express.Router();

// requests for register service
router.post('/register', register.registerCode);
router.patch('/register/:codeName', register.updateCodeElement);
router.put('/register/:codeName', register.updateCode);
router.get('/register/:codeName', register.getCode);
router.delete('/register/:codeName', register.deleteCode);

// requests for store service
router.post('/store', store.storeObject);
router.put('/store', store.updateStoredObject);
router.get('/store/:codeName', store.getAllObjects);
router.get('/store/:codeName/:objectName', store.getObject);
router.delete('/store/:codeName/:objectName', store.deleteObject);
router.delete('/store/:codeName', store.deleteAllObjects);

// requests for instantiate service
router.post('/instantiate/:language', store.instantiateObject);
router.put('/instantiate/:language', store.updateInstantiatedObject);
router.get('/instantiate/:codeName', store.getAllObjects);
router.get('/instantiate/:codeName/:objectName', store.getObject);
router.delete('/instantiate/:codeName/:objectName', store.deleteObject);
router.delete('/instantiate/:codeName', store.deleteAllObjects);

// requests for execute service
router.post('/execute/:language', task.createTask);
router.put('/execute/:language', task.updateCreatedTask);
router.get('/execute/:taskName', task.getAllTaskExecutions);
router.get('/execute/:taskName/:executionName', task.getExecution);
router.delete('/execute/:taskName', task.deleteTask);
router.delete('/execute/:taskName/:executionName', task.deleteExecution);

// requests for map service
router.post('/map', map.createMap);
router.post('/map/elements', map.setElements);
router.post('/map/entry', map.setEntry);
router.post('/map/forEach/:language', map.mapForEach);
router.patch('/map/entry', map.updateElement);
router.put('/map/elements', map.updateMap);
router.get('/map/entry/:mapName/:key', map.getElement);
router.get('/map/elements/:mapName', map.getEntries);
router.get('/map/has/:mapName/:key', map.hasElement);
router.get('/map/keys/:mapName', map.getAllKeys);
router.get('/map/values/:mapName', map.getAllValues);
router.delete('/map/:mapName/:key', map.deleteKey);
router.delete('/map/clear/:mapName', map.deleteAllEntries);
router.delete('/map/:mapName', map.deleteMap);

// requests for lock/unlock service
router.post('/lock/obj', lockunlock.lockObject);
router.post('/lock/map', lockunlock.lockMap);
router.post('/unlock/obj', lockunlock.unlockObject);
router.post('/unlock/map', lockunlock.unlockMap);
router.get('/lock/obj/:objName', lockunlock.getLockedObject);
router.get('/lock/map/:mapName/:key', lockunlock.getLockedMap);
router.delete('/lock/obj/:objName/id/:identifier', lockunlock.deleteObjectLock);
router.delete('/lock/map/:mapName/:key/id/:identifier', lockunlock.deleteMapLock);

module.exports = router;

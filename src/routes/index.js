const express = require('express');

const lockunlock = require('../controllers/lockunlock');
const register = require('../controllers/register');
const store = require('../controllers/store');
const task = require('../controllers/task');
const map = require('../controllers/map');

const router = express.Router();

// requests for register service
router.post('/registry', register.registerCode);
router.patch('/registry/:codeName', register.updateCodeElement);
router.put('/registry/:codeName', register.updateCode);
router.get('/registry/:codeName', register.getCode);
router.delete('/registry/:codeName', register.deleteCode);

// requests for store service
router.post('/storage', store.storeObject);
router.put('/storage', store.updateStoredObject);
router.get('/storage/:codeName', store.getAllObjects);
router.get('/storage/:codeName/:objectName', store.getObject);
router.delete('/storage/:codeName/:objectName', store.deleteObject);
router.delete('/storage/:codeName', store.deleteAllObjects);

// requests for instantiate service
router.post('/instance/:language', store.instantiateObject);
router.put('/instance/:language', store.updateInstantiatedObject);
router.get('/instance/:codeName', store.getAllObjects);
router.get('/instance/:codeName/:objectName', store.getObject);
router.delete('/instance/:codeName/:objectName', store.deleteObject);
router.delete('/instance/:codeName', store.deleteAllObjects);

// requests for execute service
router.post('/task/:language', task.createTask);
router.post('/task/localBatch/:language', task.executeLocalBatch);
router.post('/task/batch/:language', task.createTaskBatch);
router.put('/task/:language', task.updateCreatedTask);
router.get('/task/:taskName', task.getAllTaskExecutions);
router.get('/task/:taskName/:executionName', task.getExecution);
router.delete('/task/:taskName', task.deleteTask);
router.delete('/task/:taskName/:executionName', task.deleteExecution);

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
router.post('/sync/obj', lockunlock.lockObject);
router.post('/sync/map', lockunlock.lockMap);
router.post('/unsync/obj', lockunlock.unlockObject);
router.post('/unsync/map', lockunlock.unlockMap);
router.get('/sync/obj/:objName', lockunlock.getLockedObject);
router.get('/sync/map/:mapName/:key', lockunlock.getLockedMap);
router.delete('/sync/obj/:objName/id/:identifier', lockunlock.deleteObjectLock);
router.delete('/sync/map/:mapName/:key/id/:identifier', lockunlock.deleteMapLock);

module.exports = router;

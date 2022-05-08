const express = require('express');

const router = express.Router();
const register = require('../controllers/register');
const store = require('../controllers/store');
const task = require('../controllers/task');
const map = require('../controllers/map');

// requests for register service
router.post('/register', register.registerCode);
router.patch('/register/:codeName', register.updateCodeElement);
router.put('/register/:codeName', register.updateCode);
router.get('/register/:codeName', register.getCode);
router.delete('/register/:codeName', register.deleteCode);

// requests for store service
router.post('/store/object', store.storeObject);
router.get('/store/object/:codeName', store.getAllObjects);
router.get('/store/object/:codeName/:objectName', store.getObject);
router.delete('/store/object/:codeName/:objectName', store.deleteObject);

// requests for instantiate service
router.post('/instantiate/object', store.instantiateObject);
router.get('/instantiate/:codeName', store.getAllObjects);
router.get('/instantiate/:codeName/:objectName', store.getObject);
router.delete('/instantiate/:codeName/:objectName', store.deleteObject);

// requests for execute service
router.post('/execute/task', task.createTask);
router.get('/execute/task/:taskName/execution', task.getAllTaskExecutions);
router.get('/execute/task/:taskName/execution/:executionName', task.getExecution);
router.delete('/execute/task/:taskName', task.deleteTask);
router.delete('/execute/task/:taskName/execution/:executionName', task.deleteExecution);

// requests for map service
router.post('/map/set', map.setElement);
router.post('/map/forEach', map.mapForEach);
router.patch('/map/update', map.updateElement);
router.put('/map/update', map.updateMap);
router.get('/map/get/:mapName/:key', map.getElement);
router.get('/map/entries/:mapName', map.getEntries);
router.get('/map/has/:mapName/:key', map.hasElement);
router.get('/map/keys/:mapName', map.getAllKeys);
router.get('/map/values/:mapName', map.getAllValues);
router.delete('/map/delete/:mapName/:key', map.deleteKey);
router.delete('/map/clear/:mapName', map.clearMap);

// requests for sync service

// requests for lock and unlock service

module.exports = router;
